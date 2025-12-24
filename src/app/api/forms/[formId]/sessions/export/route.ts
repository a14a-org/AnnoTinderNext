import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { logError } from "@/lib/logger";
import { requireFormOwnership } from "@/lib/auth";

/**
 * Helper to escape CSV values
 */
const escapeCsv = (value: unknown) => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  return `"${str.replace(/"/g, '""')}"`;
};

/**
 * GET - Export session data for various formats
 *
 * Query params:
 *   status: "all" | "completed" | "incomplete" | "expired" | "screened_out" (default: "all")
 *   format: "json" | "csv" (default: "json")
 *   exportType: "default" | "df0" | "df1" | "df2" (default: "default")
 *
 * Returns various data exports based on the exportType.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const { error } = await requireFormOwnership(formId);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") || "all";
    const format = searchParams.get("format") || "json";
    const exportType = searchParams.get("exportType") || "default";

    // Get form details and assignment strategy
    const form = await db.form.findUnique({
      where: { id: formId },
      select: { id: true, title: true, assignmentStrategy: true },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // --- Export Type: DF0 (Job Set ID; Article ID) ---
    if (exportType === "df0") {
      const jobSets = await db.jobSet.findMany({
        where: { formId },
        select: {
          shortId: true,
          articles: {
            select: {
              shortId: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      const csvRows = [];
      csvRows.push(["job set id", "article id"].map(escapeCsv).join(";"));

      for (const jobSet of jobSets) {
        for (const article of jobSet.articles) {
          csvRows.push([jobSet.shortId, article.shortId].map(escapeCsv).join(";"));
        }
      }

      return new NextResponse(csvRows.join("\n"), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="df0-jobsets-${formId}.csv"`,
        },
      });
    }

    // --- Prepare Common Data for DF1, DF2 and Default ---

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
                text: true, // Needed for DF2
              },
            },
          },
        },
        formSubmission: {
          include: {
            answers: {
              include: {
                question: {
                  select: { title: true, type: true },
                },
              },
            },
          },
        },
        jobSet: {
          select: { id: true, shortId: true, articles: { select: { id: true, shortId: true } } },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    // --- Export Type: DF1 (Coder ID; Dynata ID; Job Set ID; Articles 1-3; Survey Answers) ---
    if (exportType === "df1") {
      const csvRows = [];

      // Dynamically get all survey question titles for headers
      const questionTitles = new Set<string>();
      sessions.forEach(session => {
        session.formSubmission?.answers.forEach(answer => {
          if (answer.question) {
            questionTitles.add(answer.question.title);
          }
        });
      });
      const sortedQuestionTitles = Array.from(questionTitles).sort();

      const header = [
        "coder id",
        "dynata id/psid",
        "job set id",
        "article 1 id", "article 1 progress (y/n)",
        "article 2 id", "article 2 progress (y/n)",
        "article 3 id", "article 3 progress (y/n)",
        ...sortedQuestionTitles,
      ].map(escapeCsv).join(";");
      csvRows.push(header);

      for (const session of sessions) {
        const rowData: (string | number)[] = [
          session.id, // Coder ID
          session.externalPid || "", // Dynata ID
          session.jobSet?.shortId || "", // Job Set ID
        ];

        const assignedArticles = form.assignmentStrategy === "JOB_SET" && session.jobSet
          ? session.jobSet.articles.map(a => ({ id: a.id, shortId: a.shortId }))
          : (session.assignedArticleIds ? JSON.parse(session.assignedArticleIds).map((id: string) => ({ id, shortId: `article-${id.substring(0, 4)}` })) : []); // Placeholder shortId if not fetched fully earlier

        // Ensure 3 article slots, even if fewer assigned or in individual mode
        for (let i = 0; i < 3; i++) {
          const article = assignedArticles[i];
          if (article) {
            const annotationForArticle = session.annotations.find(ann => ann.articleId === article.id);
            rowData.push(
              article.shortId,
              annotationForArticle ? "y" : "n"
            );
          } else {
            rowData.push("", ""); // Empty slots if less than 3 articles
          }
        }

        // Add survey answers
        const answersMap = new Map<string, string>();
        session.formSubmission?.answers.forEach(answer => {
          if (answer.question) {
            let value = "";
            if (answer.textValue !== null) value = answer.textValue;
            else if (answer.numberValue !== null) value = String(answer.numberValue);
            else if (answer.booleanValue !== null) value = String(answer.booleanValue);
            else if (answer.dateValue !== null) value = answer.dateValue.toISOString();
            else if (answer.jsonValue !== null) value = answer.jsonValue;
            answersMap.set(answer.question.title, value);
          }
        });

        for (const title of sortedQuestionTitles) {
          rowData.push(answersMap.get(title) || "");
        }

        csvRows.push(rowData.map(escapeCsv).join(";"));
      }

      return new NextResponse(csvRows.join("\n"), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="df1-sessions-${formId}-${statusFilter}.csv"`,
        },
      });
    }

    // --- Export Type: DF2 (Coder ID; Dynata ID; Job Set ID; Article ID; Sentence Selection; Selected Segments; Explanation) ---
    if (exportType === "df2") {
      const csvRows = [];
      csvRows.push([
        "coder id",
        "dynata id/psid",
        "job set id",
        "article id",
        "article short id",
        "sentence selection (y/n)",
        "selected segments",
        "explanation",
        "skipped (y/n)",
      ].map(escapeCsv).join(";"));

      for (const session of sessions) {
        for (const annotation of session.annotations) {
          // Get explanation from followUpAnswer - check common field names
          const followUpAnswers = annotation.followUpAnswer ? JSON.parse(annotation.followUpAnswer) : {};
          const explanation = followUpAnswers?.["reason"] || followUpAnswers?.["migrated-q1"] || "";

          const rowData: (string | number)[] = [
            session.id,
            session.externalPid || "",
            session.jobSet?.shortId || "",
            annotation.articleId,
            annotation.article?.shortId || "",
            annotation.selectedText ? "y" : "n",
            annotation.selectedText || "",
            explanation,
            annotation.skipped ? "y" : "n",
          ];
          csvRows.push(rowData.map(escapeCsv).join(";"));
        }
      }

      return new NextResponse(csvRows.join("\n"), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="df2-annotations-${formId}-${statusFilter}.csv"`,
        },
      });
    }

    // --- Default JSON/CSV Export (Existing Logic) ---
    // Build status filter (already done above)

    // Transform data for export (original structure)
    const exportData = sessions.map((session) => ({
      // Identifiers
      sessionId: session.id,
      externalPid: session.externalPid,
      sessionToken: session.sessionToken,
      jobSetId: session.jobSet?.id || null, // Include jobSetId

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
          "jobSetId", // Added to default CSV
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
        ].map(escapeCsv).join(","),
        // Data rows
        ...exportData.map((row) =>
          [
            row.externalPid || "",
            row.status,
            row.jobSetId || "",
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
            .map(escapeCsv) // Use escapeCsv for all values
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
    logError("Failed to export sessions:", error);
    return NextResponse.json(
      { error: "Failed to export sessions" },
      { status: 500 }
    );
  }
}
