import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

// GET - Fetch public form data (no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const preview = request.nextUrl.searchParams.get("preview") === "true";

    const form = await db.form.findUnique({
      where: { slug },
      include: {
        questions: {
          orderBy: { displayOrder: "asc" },
          include: {
            options: {
              orderBy: { displayOrder: "asc" },
            },
          },
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (!form.isPublished && !preview) {
      return NextResponse.json(
        { error: "This form is not published" },
        { status: 403 }
      );
    }

    // Return only necessary public data
    return NextResponse.json({
      id: form.id,
      slug: form.slug,
      title: form.title,
      description: form.description,
      brandColor: form.brandColor,
      buttonText: form.buttonText,
      submitText: form.submitText,
      showProgressBar: form.showProgressBar,
      // Quota settings
      articlesPerSession: form.articlesPerSession,
      quotaSettings: form.quotaSettings ? JSON.parse(form.quotaSettings) : null,
      sessionTimeoutMins: form.sessionTimeoutMins,
      questions: form.questions.map((q) => ({
        id: q.id,
        type: q.type,
        title: q.title,
        description: q.description,
        placeholder: q.placeholder,
        isRequired: q.isRequired,
        settings: q.settings ? JSON.parse(q.settings) : null,
        options: q.options.map((o) => ({
          id: o.id,
          label: o.label,
          value: o.value,
        })),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch public form:", error);
    return NextResponse.json(
      { error: "Failed to fetch form" },
      { status: 500 }
    );
  }
}

// POST - Submit form response
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { answers, startedAt, sessionToken } = body;

    // Check if this is a preview submission - maybe we want to allow submission in preview mode?
    // For now, let's enforce published check for submissions unless we decide otherwise.
    // If the user is previewing, they might try to submit. Ideally, preview mode shouldn't save real data, 
    // but blocking it is safer for now or allow it if we want to test the flow completely.
    // The prompt just asked for "check the preview", usually implies seeing it. 
    // I'll keep the submission strictly for published forms to prevent junk data, 
    // OR I should allow it if I want to fully test. 
    // Let's check if the user requested preview in POST? usually param is on URL.
    // The frontend hook `useFormData` fetches with GET. The submission logic uses POST.
    // If I want to allow testing submission in preview, I should check query param here too.
    
    const preview = request.nextUrl.searchParams.get("preview") === "true";

    // Find form
    const form = await db.form.findUnique({
      where: { slug },
      include: {
        questions: true,
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (!form.isPublished && !preview) {
      return NextResponse.json(
        { error: "This form is not published" },
        { status: 403 }
      );
    }

    // Get request metadata
    const ipAddress = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || undefined;
    const referrer = request.headers.get("referer") || undefined;

    // Look up annotation session if token provided
    let annotationSessionId: string | undefined;
    if (sessionToken) {
      const session = await db.annotationSession.findUnique({
        where: { sessionToken },
        select: { id: true, formId: true },
      });
      if (session && session.formId === form.id) {
        annotationSessionId = session.id;
      }
    }

    // Build answers data
    const answersData = Object.entries(answers)
      .map(([questionId, value]) => {
        const question = form.questions.find((q) => q.id === questionId);
        if (!question) return null;

        const answerBase: {
          questionId: string;
          textValue?: string;
          numberValue?: number;
          booleanValue?: boolean;
          dateValue?: Date;
          jsonValue?: string;
        } = {
          questionId,
        };

        // Store value based on question type
        switch (question.type) {
          case "SHORT_TEXT":
          case "LONG_TEXT":
          case "EMAIL":
          case "PHONE":
          case "URL":
          case "MULTIPLE_CHOICE":
          case "DROPDOWN":
            answerBase.textValue = String(value);
            break;
          case "NUMBER":
          case "RATING":
          case "SCALE":
            answerBase.numberValue = Number(value);
            break;
          case "YES_NO":
            answerBase.booleanValue = value === true || value === "yes";
            break;
          case "DATE":
          case "TIME":
            answerBase.dateValue = new Date(String(value));
            break;
          case "CHECKBOXES":
            answerBase.jsonValue = JSON.stringify(value);
            break;
          default:
            answerBase.textValue = String(value);
        }

        return answerBase;
      })
      .filter((a): a is NonNullable<typeof a> => a !== null);

    // Create submission with answers (linked to annotation session if available)
    const submission = await db.formSubmission.create({
      data: {
        formId: form.id,
        ipAddress,
        userAgent,
        referrer,
        startedAt: startedAt ? new Date(startedAt) : undefined,
        completedAt: new Date(),
        annotationSessionId,
        answers: {
          create: answersData,
        },
      },
      include: {
        answers: true,
      },
    });

    return NextResponse.json(
      { success: true, submissionId: submission.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to submit form:", error);
    return NextResponse.json(
      { error: "Failed to submit form" },
      { status: 500 }
    );
  }
}
