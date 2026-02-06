import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { logError } from "@/lib/logger";
import { buildPanelRedirectFromForm } from "@/lib/panel-redirect";
import { parseQuotaCounts } from "@/features/quota";

/**
 * POST - Complete a session and update article quotas
 *
 * Body: {
 *   sessionToken: string,
 * }
 *
 * This endpoint:
 * 1. Verifies all required articles have been annotated
 * 2. Updates quota counts on all assigned articles for the participant's demographic group
 * 3. Marks session as completed
 * 4. Returns Dynata redirect URL if applicable
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const body = await request.json();
    const { sessionToken } = body;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Session token required" },
        { status: 400 }
      );
    }

    // Get session with annotations and jobSet
    const session = await db.annotationSession.findUnique({
      where: { sessionToken },
      include: {
        annotations: {
          select: { articleId: true },
        },
        jobSet: {
          select: { id: true, quotaCounts: true }, // Include jobSet if exists
        },
      },
    });

    if (!session || session.formId !== formId) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Get form settings for Dynata redirect and assignment strategy
    const form = await db.form.findUnique({
      where: { id: formId },
      select: {
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

    // Check if already completed
    if (session.status === "completed") {
      return NextResponse.json({
        success: true,
        alreadyCompleted: true,
        returnUrl: buildPanelRedirectFromForm(form, session, "complete"),
      });
    }

    // Verify all articles annotated
    let assignedIds: string[] = [];
    if (form.assignmentStrategy === "INDIVIDUAL" && session.assignedArticleIds) {
      assignedIds = JSON.parse(session.assignedArticleIds);
    } else if (form.assignmentStrategy === "JOB_SET" && session.jobSetId && session.jobSet) {
      // For JobSet mode, assignedIds are not stored on session directly, but we can verify annotations
      const jobSetArticles = await db.article.findMany({
        where: { jobSetId: session.jobSetId },
        select: { id: true }
      });
      assignedIds = jobSetArticles.map(a => a.id);
    }

    const annotatedIds = session.annotations.map((a) => a.articleId);

    if (annotatedIds.length < session.articlesRequired) {
      return NextResponse.json(
        {
          error: "Not all articles have been annotated",
          annotated: annotatedIds.length,
          required: session.articlesRequired,
        },
        { status: 400 }
      );
    }

    const demographicGroup = session.demographicGroup;

    if (!demographicGroup) {
      return NextResponse.json(
        { error: "Session has no demographic group assigned" },
        { status: 400 }
      );
    }

    // Use a transaction to ensure consistency
    await db.$transaction(async (tx) => {
      if (form.assignmentStrategy === "JOB_SET" && session.jobSetId && session.jobSet) {
        // Update quota on the JobSet
        const jobSet = session.jobSet;
        const quotaCounts = parseQuotaCounts(jobSet.quotaCounts);
        quotaCounts[demographicGroup] = (quotaCounts[demographicGroup] || 0) + 1;

        await tx.jobSet.update({
          where: { id: jobSet.id },
          data: {
            quotaCounts: JSON.stringify(quotaCounts),
          },
        });
      } else {
        // Existing logic for INDIVIDUAL assignmentStrategy: Increment quota for each assigned article
        await Promise.all(
          assignedIds.map(async (articleId) => {
            // Get current quota counts
            const article = await tx.article.findUnique({
              where: { id: articleId },
              select: { quotaCounts: true },
            });

            if (article) {
              const quotaCounts = parseQuotaCounts(article.quotaCounts);
              quotaCounts[demographicGroup] = (quotaCounts[demographicGroup] || 0) + 1;

              await tx.article.update({
                where: { id: articleId },
                data: {
                  quotaCounts: JSON.stringify(quotaCounts),
                },
              });
            }
          })
        );
      }

      // Mark session as completed
      await tx.annotationSession.update({
        where: { id: session.id },
        data: {
          status: "completed",
          completedAt: new Date(),
          lastActiveAt: new Date(),
        },
      });
    });

    // Build Dynata redirect URL
    const returnUrl = buildPanelRedirectFromForm(form, session, "complete");

    return NextResponse.json({
      success: true,
      articlesCompleted: annotatedIds.length,
      demographicGroup: session.demographicGroup,
      returnUrl,
    });
  } catch (error) {
    logError("Failed to complete session:", error);
    return NextResponse.json(
      { error: "Failed to complete session" },
      { status: 500 }
    );
  }
}
