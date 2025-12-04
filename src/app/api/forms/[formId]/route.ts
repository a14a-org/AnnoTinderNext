import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

// GET - Fetch single form with questions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;

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

// PUT - Update form
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
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
      // Dynata settings
      dynataEnabled,
      dynataReturnUrl,
      dynataBasicCode,
    } = body;

    // Verify form exists
    const existingForm = await db.form.findFirst({
      where: { id: formId },
    });

    if (!existingForm) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

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
        // Dynata settings
        ...(dynataEnabled !== undefined && { dynataEnabled }),
        ...(dynataReturnUrl !== undefined && { dynataReturnUrl }),
        ...(dynataBasicCode !== undefined && { dynataBasicCode }),
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

// DELETE - Delete form
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;

    // Verify form exists
    const form = await db.form.findFirst({
      where: { id: formId },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

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
