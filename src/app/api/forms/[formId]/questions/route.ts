import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST - Create a new question
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const body = await request.json();
    const {
      type,
      title,
      description,
      placeholder,
      isRequired,
      settings,
      options,
      insertAfter,
    } = body;

    // Verify form exists
    const form = await db.form.findFirst({
      where: { id: formId },
      include: {
        questions: {
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Calculate display order
    let displayOrder = 1;

    if (insertAfter) {
      const afterQuestion = form.questions.find((q) => q.id === insertAfter);
      if (afterQuestion) {
        displayOrder = afterQuestion.displayOrder + 1;
        await db.question.updateMany({
          where: {
            formId,
            displayOrder: { gte: displayOrder },
          },
          data: {
            displayOrder: { increment: 1 },
          },
        });
      }
    } else {
      const lastRealQuestion = form.questions
        .filter((q) => q.displayOrder < 999)
        .sort((a, b) => b.displayOrder - a.displayOrder)[0];

      displayOrder = lastRealQuestion ? lastRealQuestion.displayOrder + 1 : 1;
    }

    // Create question with options if provided
    const question = await db.question.create({
      data: {
        formId,
        type,
        title,
        description,
        placeholder,
        isRequired: isRequired ?? false,
        displayOrder,
        settings: settings ? JSON.stringify(settings) : null,
        options:
          options && options.length > 0
            ? {
                create: options.map(
                  (opt: { label: string; value?: string }, index: number) => ({
                    label: opt.label,
                    value: opt.value || opt.label,
                    displayOrder: index,
                  })
                ),
              }
            : undefined,
      },
      include: {
        options: {
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    // Parse settings from JSON string to object
    const questionWithParsedSettings = {
      ...question,
      settings: question.settings ? JSON.parse(question.settings) : null,
    };

    return NextResponse.json(questionWithParsedSettings, { status: 201 });
  } catch (error) {
    console.error("Failed to create question:", error);
    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 }
    );
  }
}

// PUT - Reorder questions
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const body = await request.json();
    const { questionIds } = body;

    // Verify form exists
    const form = await db.form.findFirst({
      where: { id: formId },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Update display orders
    await db.$transaction(
      questionIds.map((questionId: string, index: number) =>
        db.question.update({
          where: { id: questionId },
          data: { displayOrder: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reorder questions:", error);
    return NextResponse.json(
      { error: "Failed to reorder questions" },
      { status: 500 }
    );
  }
}
