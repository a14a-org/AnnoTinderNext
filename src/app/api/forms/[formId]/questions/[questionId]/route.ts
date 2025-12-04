import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

// PUT - Update a question
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string; questionId: string }> }
) {
  try {
    const { formId, questionId } = await params;
    const body = await request.json();
    const { type, title, description, placeholder, isRequired, settings, options } =
      body;

    // Verify form exists
    const form = await db.form.findFirst({
      where: { id: formId },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Verify question exists in this form
    const existingQuestion = await db.question.findFirst({
      where: {
        id: questionId,
        formId,
      },
    });

    if (!existingQuestion) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Update question
    await db.question.update({
      where: { id: questionId },
      data: {
        ...(type !== undefined && { type }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(placeholder !== undefined && { placeholder }),
        ...(isRequired !== undefined && { isRequired }),
        ...(settings !== undefined && { settings: settings ? JSON.stringify(settings) : null }),
      },
    });

    // Update options if provided
    if (options !== undefined) {
      await db.questionOption.deleteMany({
        where: { questionId },
      });

      if (options.length > 0) {
        await db.questionOption.createMany({
          data: options.map(
            (opt: { label: string; value?: string }, index: number) => ({
              questionId,
              label: opt.label,
              value: opt.value || opt.label,
              displayOrder: index,
            })
          ),
        });
      }
    }

    // Fetch updated question with options
    const updatedQuestion = await db.question.findUnique({
      where: { id: questionId },
      include: {
        options: {
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    // Parse settings from JSON string to object
    const questionWithParsedSettings = updatedQuestion
      ? {
          ...updatedQuestion,
          settings: updatedQuestion.settings
            ? JSON.parse(updatedQuestion.settings)
            : null,
        }
      : null;

    return NextResponse.json(questionWithParsedSettings);
  } catch (error) {
    console.error("Failed to update question:", error);
    return NextResponse.json(
      { error: "Failed to update question" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a question
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string; questionId: string }> }
) {
  try {
    const { formId, questionId } = await params;

    // Verify form exists
    const form = await db.form.findFirst({
      where: { id: formId },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Verify question exists in this form
    const question = await db.question.findFirst({
      where: {
        id: questionId,
        formId,
      },
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Don't allow deleting welcome or thank you screens
    if (
      question.type === "WELCOME_SCREEN" ||
      question.type === "THANK_YOU_SCREEN"
    ) {
      return NextResponse.json(
        { error: "Cannot delete welcome or thank you screens" },
        { status: 400 }
      );
    }

    await db.question.delete({
      where: { id: questionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete question:", error);
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 }
    );
  }
}
