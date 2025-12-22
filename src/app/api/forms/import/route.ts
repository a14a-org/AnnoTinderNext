import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { logError } from "@/lib/logger";
import {
  FORM_EXPORT_VERSION,
  type FormExportData,
  type FormImportResult,
} from "@/features/form-export";

/**
 * Validate the import data structure
 */
function validateImportData(data: unknown): data is FormExportData {
  if (!data || typeof data !== "object") return false;

  const d = data as Record<string, unknown>;

  // Check version
  if (typeof d.version !== "string") return false;

  // Check form object
  if (!d.form || typeof d.form !== "object") return false;
  const form = d.form as Record<string, unknown>;
  if (typeof form.title !== "string" || !form.title.trim()) return false;

  // Check questions array
  if (!Array.isArray(d.questions)) return false;

  // Check articles array (optional but must be array if present)
  if (d.articles !== undefined && !Array.isArray(d.articles)) return false;

  // Check jobSets array (optional but must be array if present)
  if (d.jobSets !== undefined && !Array.isArray(d.jobSets)) return false;

  return true;
}

/**
 * POST - Import form from JSON
 *
 * Creates a new form from exported JSON data.
 * Generates new IDs for all entities.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const body = await request.json();

    // Validate import data
    if (!validateImportData(body)) {
      return NextResponse.json(
        { error: "Invalid import file format" },
        { status: 400 }
      );
    }

    const importData = body as FormExportData;

    // Check version compatibility
    const [majorVersion] = importData.version.split(".");
    const [currentMajor] = FORM_EXPORT_VERSION.split(".");
    if (majorVersion !== currentMajor) {
      return NextResponse.json(
        {
          error: `Incompatible version. Expected ${FORM_EXPORT_VERSION}.x, got ${importData.version}`,
        },
        { status: 400 }
      );
    }

    // Generate unique slug for new form
    const baseSlug = importData.form.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 30);
    const slug = `${baseSlug}-${nanoid(6)}`;

    // Create form with questions in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create the form
      const form = await tx.form.create({
        data: {
          slug,
          userId,
          title: importData.form.title,
          description: importData.form.description,
          brandColor: importData.form.brandColor,
          buttonText: importData.form.buttonText,
          submitText: importData.form.submitText,
          showProgressBar: importData.form.showProgressBar,
          articlesPerSession: importData.form.articlesPerSession,
          sessionTimeoutMins: importData.form.sessionTimeoutMins,
          quotaSettings: importData.form.quotaSettings
            ? JSON.stringify(importData.form.quotaSettings)
            : null,
          assignmentStrategy: importData.form.assignmentStrategy,
          dynataEnabled: importData.form.dynataEnabled,
          dynataReturnUrl: importData.form.dynataReturnUrl,
          dynataBasicCode: importData.form.dynataBasicCode,
          isPublished: false, // Always start as draft
        },
      });

      // Create questions with options
      for (const q of importData.questions) {
        await tx.question.create({
          data: {
            formId: form.id,
            type: q.type,
            title: q.title,
            description: q.description,
            placeholder: q.placeholder,
            isRequired: q.isRequired,
            displayOrder: q.displayOrder,
            settings: q.settings ? JSON.stringify(q.settings) : null,
            options: {
              create: q.options.map((opt) => ({
                label: opt.label,
                value: opt.value,
                displayOrder: opt.displayOrder,
              })),
            },
          },
        });
      }

      // Create job sets first (if any) so we can link articles
      const jobSetMap = new Map<string, string>(); // shortId -> new ID
      if (importData.jobSets && importData.jobSets.length > 0) {
        for (const js of importData.jobSets) {
          const jobSet = await tx.jobSet.create({
            data: {
              formId: form.id,
              shortId: js.shortId,
            },
          });
          jobSetMap.set(js.shortId, jobSet.id);
        }
      }

      // Create articles (if any)
      let articlesImported = 0;
      if (importData.articles && importData.articles.length > 0) {
        // Build a map of article shortId to job set ID
        const articleToJobSet = new Map<string, string>();
        if (importData.jobSets) {
          for (const js of importData.jobSets) {
            const jobSetId = jobSetMap.get(js.shortId);
            if (jobSetId) {
              for (const articleShortId of js.articleShortIds) {
                articleToJobSet.set(articleShortId, jobSetId);
              }
            }
          }
        }

        for (const a of importData.articles) {
          await tx.article.create({
            data: {
              formId: form.id,
              shortId: a.shortId,
              text: a.text,
              jobSetId: articleToJobSet.get(a.shortId) || null,
            },
          });
          articlesImported++;
        }
      }

      return {
        formId: form.id,
        slug: form.slug,
        title: form.title,
        questionsImported: importData.questions.length,
        articlesImported,
        jobSetsImported: importData.jobSets?.length || 0,
      } as FormImportResult;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    logError("Failed to import form:", error);
    return NextResponse.json(
      { error: "Failed to import form" },
      { status: 500 }
    );
  }
}
