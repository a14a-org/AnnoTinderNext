import type { QuotaSettings } from "@/features/quota";

import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { buildDynataRedirectFromForm } from "@/lib/dynata";
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

    // Check if already assigned
    if (session.assignedArticleIds) {
      const assignedIds = JSON.parse(session.assignedArticleIds);
      const articles = await db.article.findMany({
        where: { id: { in: assignedIds } },
        select: { id: true, shortId: true, text: true },
      });

      return NextResponse.json({
        assigned: true,
        alreadyAssigned: true,
        articles,
        session: {
          ...session,
          assignedArticleIds: assignedIds,
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
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Parse quota settings (use defaults if not configured)
    const quotaSettings: QuotaSettings = form.quotaSettings
      ? JSON.parse(form.quotaSettings)
      : DEFAULT_QUOTA_SETTINGS;

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
          returnUrl: buildDynataRedirectFromForm(form, session, "screenout"),
        },
        { status: 409 }
      );
    }

    const requiredArticles = form.articlesPerSession;

    // Find all articles for this form
    const allArticles = await db.article.findMany({
      where: { formId },
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
          returnUrl: buildDynataRedirectFromForm(form, session, "quota_full"),
        },
        { status: 409 }
      );
    }

    // Shuffle and select required number of articles
    const shuffled = shuffleArray(availableArticles);
    const selectedArticles = shuffled.slice(0, requiredArticles);
    const selectedIds = selectedArticles.map((a) => a.id);

    // Update session with demographics and assigned articles
    const updatedSession = await db.annotationSession.update({
      where: { id: session.id },
      data: {
        gender: demographicData.gender,
        ethnicity: demographicData.ethnicity,
        ageRange: demographicData.ageRange,
        demographicGroup,
        assignedArticleIds: JSON.stringify(selectedIds),
        status: "annotating",
        lastActiveAt: new Date(),
      },
    });

    return NextResponse.json({
      assigned: true,
      articles: selectedArticles.map((a) => ({
        id: a.id,
        shortId: a.shortId,
        text: a.text,
      })),
      session: {
        ...updatedSession,
        assignedArticleIds: selectedIds,
      },
      demographicGroup,
      totalAssigned: selectedIds.length,
    });
  } catch (error) {
    console.error("Failed to assign articles:", error);
    return NextResponse.json(
      { error: "Failed to assign articles" },
      { status: 500 }
    );
  }
};
