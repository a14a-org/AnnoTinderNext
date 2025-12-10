import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireFormOwnership } from "@/lib/auth";

// GET - List all submissions for a form (requires ownership)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const { error } = await requireFormOwnership(formId);
    if (error) return error;

    // Get form with questions
    const form = await db.form.findFirst({
      where: { id: formId },
      include: {
        questions: {
          orderBy: { displayOrder: "asc" },
          where: {
            type: {
              notIn: ["WELCOME_SCREEN", "THANK_YOU_SCREEN"],
            },
          },
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const submissions = await db.formSubmission.findMany({
      where: { formId },
      include: {
        answers: {
          include: {
            question: {
              select: {
                id: true,
                title: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    // Transform submissions for easier consumption
    const transformedSubmissions = submissions.map((submission) => {
      // Helper to extract value from answer
      const extractValue = (answer: typeof submission.answers[0]): unknown => {
        if (answer.textValue !== null) return answer.textValue;
        if (answer.numberValue !== null) return answer.numberValue;
        if (answer.booleanValue !== null) return answer.booleanValue;
        if (answer.dateValue !== null) return answer.dateValue;
        if (answer.jsonValue !== null) {
          try {
            return JSON.parse(answer.jsonValue);
          } catch {
            return answer.jsonValue;
          }
        }
        return undefined;
      };

      const answerMap = Object.fromEntries(
        submission.answers.map((answer) => [
          answer.questionId,
          {
            questionId: answer.questionId,
            questionTitle: answer.question.title,
            questionType: answer.question.type,
            value: extractValue(answer),
          },
        ])
      );

      return {
        id: submission.id,
        submittedAt: submission.submittedAt,
        startedAt: submission.startedAt,
        completedAt: submission.completedAt,
        answers: answerMap,
      };
    });

    return NextResponse.json({
      form: {
        id: form.id,
        title: form.title,
        questions: form.questions,
      },
      submissions: transformedSubmissions,
      total: submissions.length,
    });
  } catch (error) {
    console.error("Failed to fetch submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a submission (requires ownership)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const { error } = await requireFormOwnership(formId);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get("submissionId");

    if (!submissionId) {
      return NextResponse.json(
        { error: "Submission ID required" },
        { status: 400 }
      );
    }

    await db.formSubmission.delete({
      where: { id: submissionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete submission:", error);
    return NextResponse.json(
      { error: "Failed to delete submission" },
      { status: 500 }
    );
  }
}
