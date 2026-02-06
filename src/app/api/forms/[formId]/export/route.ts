import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireFormOwnership } from "@/lib/auth";
import { logError } from "@/lib/logger";
import {
  FORM_EXPORT_VERSION,
  type FormExportData,
  type ExportedQuestion,
  type ExportedArticle,
  type ExportedJobSet,
} from "@/features/form-export";

/**
 * GET - Export form as JSON
 *
 * Exports the complete form configuration including:
 * - Form settings (title, branding, quota settings, etc.)
 * - Questions with their options and settings
 * - Articles (for text annotation forms)
 * - Job sets (if using JOB_SET assignment strategy)
 *
 * The export excludes:
 * - Database IDs (regenerated on import)
 * - User/ownership information
 * - Submissions and responses
 * - Session data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const { error } = await requireFormOwnership(formId);
    if (error) return error;

    // Fetch form with all related data
    const form = await db.form.findUnique({
      where: { id: formId },
      include: {
        questions: {
          orderBy: { displayOrder: "asc" },
          include: {
            options: {
              orderBy: { displayOrder: "asc" },
            },
          },
        },
        articles: {
          orderBy: { createdAt: "asc" },
          select: {
            shortId: true,
            text: true,
            jobSetId: true,
          },
        },
        jobSets: {
          orderBy: { createdAt: "asc" },
          include: {
            articles: {
              select: { shortId: true },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Transform questions - strip IDs, parse settings
    const exportedQuestions: ExportedQuestion[] = form.questions.map((q) => ({
      type: q.type,
      title: q.title,
      description: q.description,
      placeholder: q.placeholder,
      isRequired: q.isRequired,
      displayOrder: q.displayOrder,
      settings: q.settings ? JSON.parse(q.settings) : null,
      options: q.options.map((opt) => ({
        label: opt.label,
        value: opt.value,
        displayOrder: opt.displayOrder,
      })),
    }));

    // Transform articles - strip IDs
    const exportedArticles: ExportedArticle[] = form.articles.map((a) => ({
      shortId: a.shortId,
      text: a.text,
    }));

    // Transform job sets - use shortIds for article references
    const exportedJobSets: ExportedJobSet[] = form.jobSets.map((js) => ({
      shortId: js.shortId,
      articleShortIds: js.articles.map((a) => a.shortId),
    }));

    // Parse quota settings
    let quotaSettings = null;
    if (form.quotaSettings) {
      try {
        quotaSettings = JSON.parse(form.quotaSettings);
      } catch {
        quotaSettings = null;
      }
    }

    // Build export data
    const exportData: FormExportData = {
      version: FORM_EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      form: {
        title: form.title,
        description: form.description,
        brandColor: form.brandColor,
        buttonText: form.buttonText,
        submitText: form.submitText,
        showProgressBar: form.showProgressBar,
        articlesPerSession: form.articlesPerSession,
        sessionTimeoutMins: form.sessionTimeoutMins,
        quotaSettings,
        assignmentStrategy: form.assignmentStrategy,
        dynataEnabled: form.dynataEnabled,
        dynataReturnUrl: form.dynataReturnUrl,
        dynataBasicCode: form.dynataBasicCode,
        motivactionEnabled: form.motivactionEnabled,
        motivactionReturnUrl: form.motivactionReturnUrl,
      },
      questions: exportedQuestions,
      articles: exportedArticles,
      jobSets: exportedJobSets,
    };

    // Generate filename
    const safeTitle = form.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 30);
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `${safeTitle}-${timestamp}.json`;

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logError("Failed to export form:", error);
    return NextResponse.json(
      { error: "Failed to export form" },
      { status: 500 }
    );
  }
}
