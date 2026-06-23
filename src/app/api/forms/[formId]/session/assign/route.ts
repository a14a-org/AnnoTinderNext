import type { QuotaSettings } from "@/features/quota";

import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { logError } from "@/lib/logger";
import { buildPanelRedirectFromForm } from "@/lib/panel-redirect";
import { isUnder18 } from "@/lib/age-validation";
import {
  classifyParticipant,
  DEFAULT_QUOTA_SETTINGS,
  hasQuotaSpace,
  parseQuotaCounts,
} from "@/features/quota";

/**
 * Coerce a slider answer (sent as string from the frontend) to an Int, or null
 * for missing/invalid values. Out-of-range values are kept — clamping is a
 * frontend concern.
 */
const toInt = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

/**
 * Map the raw demographic answer object (keyed by field id, string values) to
 * the typed AnnotationSession columns. Always returns the full shape so every
 * update site overwrites stale resume-state consistently.
 */
const richDemographicFields = (d: Record<string, string | undefined>) => ({
  birthDate: d.birthDate ?? null,
  education: d.education ?? null,
  politicalOrientation: toInt(d.politicalOrientation),
  religion: d.religion ?? null,
  feelingGeneral: toInt(d.feelingGeneral),
  feelingOtherEthnicity: toInt(d.feelingOtherEthnicity),
  discriminationExperience: d.discriminationExperience ?? null,
  hasOtherEthnicBackground: d.hasOtherEthnicBackground ?? null,
});

/**
 * Shuffle array using Fisher-Yates algorithm
 */
const shuffleArray = <T>(array: T[]) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * POST - Assign articles to session after demographics
 *
 * Body: {
 *   sessionToken: string,
 *   demographics: {
 *     gender?: string,
 *     ethnicity?: string,
 *     ageRange?: string,
 *     [key: string]: string | undefined
 *   }
 * }
 *
 * This endpoint:
 * 1. Updates session with demographics
 * 2. Classifies user into a demographic group using configurable rules
 * 3. Finds available articles (quota not met for this demographic group)
 * 4. Assigns articles to session
 * 5. Returns articles or screens out if quota full
 */
export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) => {
  try {
    const { formId } = await params;
    const body = await request.json();
    const { sessionToken, demographics } = body;

    // Support both old format (flat) and new format (nested)
    const demographicData = demographics || {
      gender: body.gender,
      ethnicity: body.ethnicity,
      ageRange: body.ageRange,
    };

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Session token required" },
        { status: 400 }
      );
    }

    // Get session
    const session = await db.annotationSession.findUnique({
      where: { sessionToken },
    });

    if (!session || session.formId !== formId) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Stale terminal states whose stored assignment must not short-circuit fresh validation
    // (otherwise a participant who declined consent or was screened out, then revisits via the same
    // browser, would silently bypass age/quota/group checks on resubmitted demographics).
    const RESUMABLE_STATUSES = new Set(["started", "demographics", "annotating", "completed"]);

    // Refresh rich demographics on every POST, even when the short-circuit below
    // returns an already-assigned response. Without this, a participant who
    // resumes a session (browser back, multi-tab, panel relaunch) submits fresh
    // demographics but they're silently dropped — the bug that left rich columns
    // null for legacy sessions. We only write the additive rich fields; gender /
    // ethnicity / demographicGroup are intentionally left untouched on resume to
    // preserve quota classification.
    if (demographicData?.gender) {
      await db.annotationSession.update({
        where: { id: session.id },
        data: richDemographicFields(demographicData),
      });
    }

    // Check if already assigned (either by articles or jobSet)
    if ((session.assignedArticleIds || session.jobSetId) && RESUMABLE_STATUSES.has(session.status)) {
      let assignedArticles: { id: string; shortId: string; text: string; paragraphBreakIndices: string | null }[] = [];
      let assignedIds: string[] = [];
      let assignedJobSetId: string | null = null;

      if (session.jobSetId) {
        const assignedJobSet = await db.jobSet.findUnique({
          where: { id: session.jobSetId },
          include: { articles: { select: { id: true, shortId: true, text: true, paragraphBreakIndices: true } } },
        });
        if (assignedJobSet) {
          assignedArticles = assignedJobSet.articles;
          assignedIds = assignedJobSet.articles.map(a => a.id);
          assignedJobSetId = assignedJobSet.id;
        }
      } else if (session.assignedArticleIds) {
        assignedIds = JSON.parse(session.assignedArticleIds);
        assignedArticles = await db.article.findMany({
          where: { id: { in: assignedIds } },
          select: { id: true, shortId: true, text: true, paragraphBreakIndices: true },
        });
      }

      return NextResponse.json({
        assigned: true,
        alreadyAssigned: true,
        articles: assignedArticles,
        session: {
          ...session,
          assignedArticleIds: assignedIds,
          jobSetId: assignedJobSetId,
        },
        demographicGroup: session.demographicGroup,
      });
    }

    // Get form settings
    const form = await db.form.findUnique({
      where: { id: formId },
      select: {
        articlesPerSession: true,
        quotaSettings: true,
        dynataEnabled: true,
        dynataReturnUrl: true,
        dynataBasicCode: true,
        motivactionEnabled: true,
        motivactionReturnUrl: true,
        assignmentStrategy: true,
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Parse quota settings (use defaults if not configured)
    const quotaSettings: QuotaSettings = form.quotaSettings
      ? JSON.parse(form.quotaSettings)
      : DEFAULT_QUOTA_SETTINGS;

    // Check age requirement (if birthDate provided)
    if (demographicData.birthDate && isUnder18(demographicData.birthDate)) {
      // Screen out under-18 participants
      await db.annotationSession.update({
        where: { id: session.id },
        data: {
          gender: demographicData.gender,
          ethnicity: demographicData.ethnicity,
          ageRange: demographicData.ageRange,
          ...richDemographicFields(demographicData),
          status: "screened_out",
        },
      });

      return NextResponse.json(
        {
          assigned: false,
          reason: "under_age",
          message: "Je moet minimaal 18 jaar oud zijn om deel te nemen aan dit onderzoek.",
          returnUrl: buildPanelRedirectFromForm(form, session, "screenout"),
        },
        { status: 409 }
      );
    }

    // No demographic screenout: for the native-Dutch top-up wave every consenting
    // participant who passes the age gate is admitted. Quota settings use a single
    // catch-all group covering every ethnicity option, so classifyParticipant()
    // always matches and the no-matching-group branch below is an unreachable safety
    // net (it would only trigger if ethnicity were somehow missing). The earlier
    // AAVA-specific "Nederlands → hasOtherEthnicBackground → Nee" screenout is gone,
    // but the hasOtherEthnicBackground follow-up question is KEPT: its answer is
    // still collected as demographic data via richDemographicFields() above, it just
    // no longer gates admission (both "Nee" and "Ja, namelijk: X" now continue).
    const demographicGroup = classifyParticipant(demographicData, quotaSettings);

    if (!demographicGroup) {
      // No matching group found - screen out
      await db.annotationSession.update({
        where: { id: session.id },
        data: {
          gender: demographicData.gender,
          ethnicity: demographicData.ethnicity,
          ageRange: demographicData.ageRange,
          ...richDemographicFields(demographicData),
          status: "screened_out",
        },
      });

      return NextResponse.json(
        {
          assigned: false,
          reason: "no_matching_group",
          message: "Participant does not match any demographic group",
          returnUrl: buildPanelRedirectFromForm(form, session, "screenout"),
        },
        { status: 409 }
      );
    }

    let assignedArticles: { id: string; shortId: string; text: string; paragraphBreakIndices: string | null }[] = [];
    let assignedIds: string[] = [];
    let articlesToRequire = form.articlesPerSession;
    let assignedJobSetId: string | null = null;


    if (form.assignmentStrategy === "JOB_SET") {
      // articlesToRequire is set from the chosen jobSet's actual article count
      // below — never trust form.articlesPerSession as a stand-in. A jobSet
      // with fewer articles than form.articlesPerSession (e.g., set-360 with
      // 3 articles vs the form's expected 4) would otherwise leave its
      // participants permanently stuck at "annotating" status because
      // /session/complete checks completed >= articlesRequired.

      // Find all job sets for this form
      const allJobSets = await db.jobSet.findMany({
        where: { formId },
        include: { articles: { select: { id: true, shortId: true, text: true, paragraphBreakIndices: true } } },
      });

      // Filter to job sets that still have quota space for this group
      const availableJobSets = allJobSets.filter((jobSet) => {
        const quotaCounts = parseQuotaCounts(jobSet.quotaCounts);
        return hasQuotaSpace(quotaCounts, demographicGroup, quotaSettings);
      });

      // Check if any job set available
      if (availableJobSets.length === 0) {
        // Update session as screened out
        await db.annotationSession.update({
          where: { id: session.id },
          data: {
            gender: demographicData.gender,
            ethnicity: demographicData.ethnicity,
            ageRange: demographicData.ageRange,
            ...richDemographicFields(demographicData),
            demographicGroup,
            status: "screened_out",
          },
        });

        return NextResponse.json(
          {
            assigned: false,
            reason: "quota_full",
            message: `No job sets available for ${demographicGroup} demographic`,
            availableCount: 0,
            required: articlesToRequire,
            returnUrl: buildPanelRedirectFromForm(form, session, "quota_full"),
          },
          { status: 409 }
        );
      }

      // Bias new participants toward the least-annotated job sets — total annotations
      // across ALL demographic groups, per Zilin's request to fill thin coverage
      // "regardless of ethnic background" — WITHOUT herding under concurrent traffic.
      // quotaCounts only updates on completion (see /session/complete), so simultaneous
      // assigns see stale counts; a deterministic global-minimum pick would funnel a
      // whole Motivaction burst onto a single set. Instead use "power of D choices":
      // sample a handful of random available sets and take the least-covered of the
      // sample. Thin sets still win whenever they're sampled, but different participants
      // draw different samples, so concurrent assigns can't all converge on one set
      // (herding is capped at ~SAMPLE_SIZE/total per burst). The corrupt high-count
      // outlier set is effectively never chosen (it can't be the min of any sample).
      const totalCoverage = (counts: Record<string, number>) =>
        Object.values(counts).reduce((sum, n) => sum + (typeof n === "number" ? n : 0), 0);
      const SAMPLE_SIZE = 10;
      const selectedJobSet = shuffleArray(availableJobSets)
        .slice(0, SAMPLE_SIZE)
        .sort(
          (a, b) =>
            totalCoverage(parseQuotaCounts(a.quotaCounts)) -
            totalCoverage(parseQuotaCounts(b.quotaCounts))
        )[0];
      assignedArticles = selectedJobSet.articles;
      assignedIds = selectedJobSet.articles.map((a) => a.id);
      assignedJobSetId = selectedJobSet.id;
      articlesToRequire = selectedJobSet.articles.length;

    } else { // INDIVIDUAL assignmentStrategy
      const requiredArticles = form.articlesPerSession;

      // Find all articles for this form
      const allArticles = await db.article.findMany({
        where: { formId, jobSetId: null }, // Only consider individual articles
        select: {
          id: true,
          shortId: true,
          text: true,
          paragraphBreakIndices: true,
          quotaCounts: true,
        },
      });

      // Filter to articles that still have quota space for this group
      const availableArticles = allArticles.filter((article) => {
        const quotaCounts = parseQuotaCounts(article.quotaCounts);
        return hasQuotaSpace(quotaCounts, demographicGroup, quotaSettings);
      });

      // Check if enough articles available
      if (availableArticles.length < requiredArticles) {
        // Update session as screened out
        await db.annotationSession.update({
          where: { id: session.id },
          data: {
            gender: demographicData.gender,
            ethnicity: demographicData.ethnicity,
            ageRange: demographicData.ageRange,
            ...richDemographicFields(demographicData),
            demographicGroup,
            status: "screened_out",
          },
        });

        return NextResponse.json(
          {
            assigned: false,
            reason: "quota_full",
            message: `Not enough articles available for ${demographicGroup} demographic`,
            availableCount: availableArticles.length,
            required: requiredArticles,
            returnUrl: buildPanelRedirectFromForm(form, session, "quota_full"),
          },
          { status: 409 }
        );
      }

      // Shuffle and select required number of articles
      assignedArticles = shuffleArray(availableArticles).slice(0, requiredArticles);
      assignedIds = assignedArticles.map((a) => a.id);
      articlesToRequire = requiredArticles;
    }

    // Update session with demographics and assigned articles/jobSet
    const updatedSession = await db.annotationSession.update({
      where: { id: session.id },
      data: {
        gender: demographicData.gender,
        ethnicity: demographicData.ethnicity,
        ageRange: demographicData.ageRange,
        ...richDemographicFields(demographicData),
        demographicGroup,
        assignedArticleIds: form.assignmentStrategy === "INDIVIDUAL" ? JSON.stringify(assignedIds) : null, // Only for individual mode
        jobSetId: assignedJobSetId, // Only for job set mode
        articlesRequired: articlesToRequire,
        status: "annotating",
        lastActiveAt: new Date(),
      },
    });

    return NextResponse.json({
      assigned: true,
      articles: assignedArticles.map((a) => ({
        id: a.id,
        shortId: a.shortId,
        text: a.text,
        paragraphBreakIndices: a.paragraphBreakIndices,
      })),
      session: {
        ...updatedSession,
        assignedArticleIds: assignedIds,
        jobSetId: assignedJobSetId,
      },
      demographicGroup,
      totalAssigned: assignedIds.length,
    });
  } catch (error) {
    logError("Failed to assign articles:", error);
    return NextResponse.json(
      { error: "Failed to assign articles" },
      { status: 500 }
    );
  }
};
