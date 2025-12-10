import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { logError } from "@/lib/logger";

/**
 * POST - Save a single annotation for an article
 *
 * Body: {
 *   sessionToken: string,
 *   articleId: string,
 *   selectedText?: string,
 *   sentenceIndex?: number,
 *   startIndex?: number,
 *   endIndex?: number,
 *   followUpAnswers?: string, // JSON string of Record<questionId, answer>
 *   skipped?: boolean,
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const body = await request.json();
    const {
      sessionToken,
      articleId,
      selectedText,
      sentenceIndex,
      startIndex,
      endIndex,
      followUpAnswers,
      skipped = false,
    } = body;

    if (!sessionToken || !articleId) {
      return NextResponse.json(
        { error: "Session token and article ID required" },
        { status: 400 }
      );
    }

    // Get session and verify
    const session = await db.annotationSession.findUnique({
      where: { sessionToken },
      include: {
        annotations: {
          select: { articleId: true },
        },
      },
    });

    if (!session || session.formId !== formId) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (session.status !== "annotating") {
      return NextResponse.json(
        { error: "Session is not in annotating state" },
        { status: 400 }
      );
    }

    // Verify article is assigned to this session
    let isAssigned = false;

    if (session.assignedArticleIds) {
      // INDIVIDUAL mode: check assignedArticleIds
      const assignedIds = JSON.parse(session.assignedArticleIds);
      isAssigned = assignedIds.includes(articleId);
    } else if (session.jobSetId) {
      // JOB_SET mode: check if article belongs to the assigned job set
      const jobSetArticle = await db.article.findFirst({
        where: {
          id: articleId,
          jobSetId: session.jobSetId,
        },
      });
      isAssigned = !!jobSetArticle;
    }

    if (!isAssigned) {
      return NextResponse.json(
        { error: "Article not assigned to this session" },
        { status: 400 }
      );
    }

    // Check if already annotated
    const existingAnnotation = session.annotations.find(
      (a) => a.articleId === articleId
    );

    if (existingAnnotation) {
      // Update existing annotation
      await db.articleAnnotation.updateMany({
        where: {
          sessionId: session.id,
          articleId,
        },
        data: {
          selectedText,
          sentenceIndex,
          startIndex,
          endIndex,
          // Store all follow-up answers as JSON in followUpAnswer field
          followUpAnswer: followUpAnswers,
          skipped,
        },
      });
    } else {
      // Create new annotation
      await db.articleAnnotation.create({
        data: {
          sessionId: session.id,
          articleId,
          selectedText,
          sentenceIndex,
          startIndex,
          endIndex,
          // Store all follow-up answers as JSON in followUpAnswer field
          followUpAnswer: followUpAnswers,
          skipped,
        },
      });
    }

    // Update session
    const completedCount = session.annotations.length + (existingAnnotation ? 0 : 1);

    await db.annotationSession.update({
      where: { id: session.id },
      data: {
        articlesCompleted: completedCount,
        lastActiveAt: new Date(),
      },
    });

    // Check if all articles completed
    const allCompleted = completedCount >= session.articlesRequired;

    return NextResponse.json({
      success: true,
      articlesCompleted: completedCount,
      articlesRequired: session.articlesRequired,
      allCompleted,
    });
  } catch (error) {
    logError("Failed to save annotation:", error);
    return NextResponse.json(
      { error: "Failed to save annotation" },
      { status: 500 }
    );
  }
}
