import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireFormOwnership } from "@/lib/auth";

// GET - Fetch single form with questions (requires ownership)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const { error } = await requireFormOwnership(formId);
    if (error) return error;

    const form = await db.form.findFirst({
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
        _count: {
          select: { submissions: true, articles: true },
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Parse question settings from JSON strings to objects
    const formWithParsedSettings = {
      ...form,
      questions: form.questions.map((q) => ({
        ...q,
        settings: q.settings ? JSON.parse(q.settings) : null,
      })),
    };

    return NextResponse.json(formWithParsedSettings);
  } catch (error) {
    console.error("Failed to fetch form:", error);
    return NextResponse.json(
      { error: "Failed to fetch form" },
      { status: 500 }
    );
  }
}

// PUT - Update form (requires ownership)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const { error } = await requireFormOwnership(formId);
    if (error) return error;

    const body = await request.json();
    const {
      title,
      description,
      brandColor,
      buttonText,
      submitText,
      isPublished,
      allowMultiple,
      showProgressBar,
      // Quota settings
      articlesPerSession,
      sessionTimeoutMins,
      quotaSettings,
      assignmentStrategy,
      // Dynata settings
      dynataEnabled,
      dynataReturnUrl,
      dynataBasicCode,
      // Motivaction settings
      motivactionEnabled,
      motivactionReturnUrl,
    } = body;

    // Handle quota settings - can be passed as object or string
    let quotaSettingsJson: string | undefined;
    if (quotaSettings !== undefined) {
      quotaSettingsJson = typeof quotaSettings === "string"
        ? quotaSettings
        : JSON.stringify(quotaSettings);
    }

    const updated = await db.form.update({
      where: { id: formId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(brandColor !== undefined && { brandColor }),
        ...(buttonText !== undefined && { buttonText }),
        ...(submitText !== undefined && { submitText }),
        ...(isPublished !== undefined && { isPublished }),
        ...(allowMultiple !== undefined && { allowMultiple }),
        ...(showProgressBar !== undefined && { showProgressBar }),
        // Quota settings
        ...(articlesPerSession !== undefined && { articlesPerSession }),
        ...(sessionTimeoutMins !== undefined && { sessionTimeoutMins }),
        ...(quotaSettingsJson !== undefined && { quotaSettings: quotaSettingsJson }),
        ...(assignmentStrategy !== undefined && { assignmentStrategy }),
        // Dynata settings
        ...(dynataEnabled !== undefined && { dynataEnabled }),
        ...(dynataReturnUrl !== undefined && { dynataReturnUrl }),
        ...(dynataBasicCode !== undefined && { dynataBasicCode }),
        // Motivaction settings
        ...(motivactionEnabled !== undefined && { motivactionEnabled }),
        ...(motivactionReturnUrl !== undefined && { motivactionReturnUrl }),
      },
      include: {
        questions: {
          orderBy: { displayOrder: "asc" },
          include: {
            options: {
              orderBy: { displayOrder: "asc" },
            },
          },
        },
        _count: {
          select: { submissions: true, articles: true },
        },
      },
    });

    // Parse question settings from JSON strings to objects
    const updatedWithParsedSettings = {
      ...updated,
      questions: updated.questions.map((q) => ({
        ...q,
        settings: q.settings ? JSON.parse(q.settings) : null,
      })),
    };

    return NextResponse.json(updatedWithParsedSettings);
  } catch (error) {
    console.error("Failed to update form:", error);
    return NextResponse.json(
      { error: "Failed to update form" },
      { status: 500 }
    );
  }
}

// DELETE - Delete form (requires ownership)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const { error } = await requireFormOwnership(formId);
    if (error) return error;

    await db.form.delete({
      where: { id: formId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete form:", error);
    return NextResponse.json(
      { error: "Failed to delete form" },
      { status: 500 }
    );
  }
}
