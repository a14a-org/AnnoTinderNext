import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET - Export session data for dropout validation
 *
 * Query params:
 *   status: "all" | "completed" | "incomplete" | "expired" | "screened_out" (default: "all")
 *   format: "json" | "csv" (default: "json")
 *
 * Returns all sessions with their demographics, annotations, and status.
 * Useful for validating dropouts with panel providers like Dynata.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") || "all";
    const format = searchParams.get("format") || "json";

    // Verify form exists
    const form = await db.form.findUnique({
      where: { id: formId },
      select: { id: true, title: true },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Build status filter
    let statusWhere: { status?: string | { in: string[] } } = {};
    switch (statusFilter) {
      case "completed":
        statusWhere = { status: "completed" };
        break;
      case "incomplete":
        statusWhere = { status: { in: ["started", "demographics", "annotating"] } };
        break;
      case "expired":
        statusWhere = { status: "expired" };
        break;
      case "screened_out":
        statusWhere = { status: "screened_out" };
        break;
      case "all":
      default:
        // No filter
        break;
    }

    // Fetch sessions with all related data
    const sessions = await db.annotationSession.findMany({
      where: {
        formId,
        ...statusWhere,
      },
      include: {
        annotations: {
          include: {
            article: {
              select: {
                shortId: true,
              },
            },
          },
        },
        formSubmission: {
          select: {
            id: true,
            submittedAt: true,
          },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    // Transform data for export
    const exportData = sessions.map((session) => ({
      // Identifiers
      sessionId: session.id,
      externalPid: session.externalPid,
      sessionToken: session.sessionToken,

      // Status
      status: session.status,

      // Demographics
      demographics: {
        gender: session.gender,
        ethnicity: session.ethnicity,
        ageRange: session.ageRange,
        demographicGroup: session.demographicGroup,
      },

      // Progress
      progress: {
        articlesRequired: session.articlesRequired,
        articlesCompleted: session.articlesCompleted,
        annotationsSaved: session.annotations.length,
      },

      // Annotations
      annotations: session.annotations.map((ann) => ({
        articleId: ann.articleId,
        articleShortId: ann.article.shortId,
        selectedText: ann.selectedText,
        startIndex: ann.startIndex,
        endIndex: ann.endIndex,
        followUpAnswers: ann.followUpAnswer ? JSON.parse(ann.followUpAnswer) : null,
        skipped: ann.skipped,
        createdAt: ann.createdAt.toISOString(),
      })),

      // Timestamps
      timestamps: {
        startedAt: session.startedAt.toISOString(),
        lastActiveAt: session.lastActiveAt.toISOString(),
        completedAt: session.completedAt?.toISOString() || null,
      },

      // Linked form submission
      formSubmissionId: session.formSubmission?.id || null,
      formSubmittedAt: session.formSubmission?.submittedAt?.toISOString() || null,

      // Return URL (for reference)
      returnUrl: session.returnUrl,
    }));

    // Return as CSV if requested
    if (format === "csv") {
      const csvRows = [
        // Header row
        [
          "externalPid",
          "status",
          "gender",
          "ethnicity",
          "ageRange",
          "demographicGroup",
          "articlesRequired",
          "articlesCompleted",
          "annotationsSaved",
          "startedAt",
          "lastActiveAt",
          "completedAt",
          "formSubmissionId",
        ].join(","),
        // Data rows
        ...exportData.map((row) =>
          [
            row.externalPid || "",
            row.status,
            row.demographics.gender || "",
            row.demographics.ethnicity || "",
            row.demographics.ageRange || "",
            row.demographics.demographicGroup || "",
            row.progress.articlesRequired,
            row.progress.articlesCompleted,
            row.progress.annotationsSaved,
            row.timestamps.startedAt,
            row.timestamps.lastActiveAt,
            row.timestamps.completedAt || "",
            row.formSubmissionId || "",
          ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(",")
        ),
      ].join("\n");

      return new NextResponse(csvRows, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="sessions-${formId}-${statusFilter}.csv"`,
        },
      });
    }

    // Return JSON
    return NextResponse.json({
      formId,
      formTitle: form.title,
      exportedAt: new Date().toISOString(),
      filter: statusFilter,
      totalSessions: exportData.length,
      sessions: exportData,
    });
  } catch (error) {
    console.error("Failed to export sessions:", error);
    return NextResponse.json(
      { error: "Failed to export sessions" },
      { status: 500 }
    );
  }
}
