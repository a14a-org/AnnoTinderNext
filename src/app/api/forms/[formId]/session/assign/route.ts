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

    // Check if already assigned (either by articles or jobSet)
    if (session.assignedArticleIds || session.jobSetId) {
      let assignedArticles: { id: string; shortId: string; text: string }[] = [];
      let assignedIds: string[] = [];
      let assignedJobSetId: string | null = null;

      if (session.jobSetId) {
        const assignedJobSet = await db.jobSet.findUnique({
          where: { id: session.jobSetId },
          include: { articles: { select: { id: true, shortId: true, text: true } } },
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
          select: { id: true, shortId: true, text: true },
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

    // Classify participant into a demographic group
    const demographicGroup = classifyParticipant(demographicData, quotaSettings);

    if (!demographicGroup) {
      // No matching group found - screen out
      await db.annotationSession.update({
        where: { id: session.id },
        data: {
          gender: demographicData.gender,
          ethnicity: demographicData.ethnicity,
          ageRange: demographicData.ageRange,
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

    let assignedArticles: { id: string; shortId: string; text: string }[] = [];
    let assignedIds: string[] = [];
    let articlesToRequire = form.articlesPerSession;
    let assignedJobSetId: string | null = null;


    if (form.assignmentStrategy === "JOB_SET") {
      articlesToRequire = form.articlesPerSession; // Job set size is stored here now

      // Find all job sets for this form
      const allJobSets = await db.jobSet.findMany({
        where: { formId },
        include: { articles: { select: { id: true, shortId: true, text: true } } },
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

      // Select one random available job set
      const selectedJobSet = shuffleArray(availableJobSets)[0];
      assignedArticles = selectedJobSet.articles;
      assignedIds = selectedJobSet.articles.map((a) => a.id);
      assignedJobSetId = selectedJobSet.id;

    } else { // INDIVIDUAL assignmentStrategy
      const requiredArticles = form.articlesPerSession;

      // Find all articles for this form
      const allArticles = await db.article.findMany({
        where: { formId, jobSetId: null }, // Only consider individual articles
        select: {
          id: true,
          shortId: true,
          text: true,
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
