import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - List all submissions for a form
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;

    // Verify form exists
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
      const answerMap: Record<
        string,
        {
          questionId: string;
          questionTitle: string;
          questionType: string;
          value: unknown;
        }
      > = {};

      submission.answers.forEach((answer) => {
        let value: unknown;

        if (answer.textValue !== null) {
          value = answer.textValue;
        } else if (answer.numberValue !== null) {
          value = answer.numberValue;
        } else if (answer.booleanValue !== null) {
          value = answer.booleanValue;
        } else if (answer.dateValue !== null) {
          value = answer.dateValue;
        } else if (answer.jsonValue !== null) {
          try {
            value = JSON.parse(answer.jsonValue);
          } catch {
            value = answer.jsonValue;
          }
        }

        answerMap[answer.questionId] = {
          questionId: answer.questionId,
          questionTitle: answer.question.title,
          questionType: answer.question.type,
          value,
        };
      });

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

// DELETE - Delete a submission
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get("submissionId");

    if (!submissionId) {
      return NextResponse.json(
        { error: "Submission ID required" },
        { status: 400 }
      );
    }

    // Verify form exists
    const form = await db.form.findFirst({
      where: { id: formId },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
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
