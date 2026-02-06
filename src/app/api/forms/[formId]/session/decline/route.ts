import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { logError } from "@/lib/logger";
import { buildPanelRedirectFromForm } from "@/lib/panel-redirect";

/**
 * POST - Mark session as consent_declined and return redirect URL
 *
 * Body: {
 *   sessionToken: string
 * }
 *
 * Returns: {
 *   success: boolean,
 *   redirectUrl: string | null
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const body = await request.json();
    const { sessionToken } = body;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Session token required" },
        { status: 400 }
      );
    }

    // Get the session
    const session = await db.annotationSession.findUnique({
      where: { sessionToken },
      include: {
        form: {
          select: {
            id: true,
            dynataEnabled: true,
            dynataReturnUrl: true,
            dynataBasicCode: true,
            motivactionEnabled: true,
            motivactionReturnUrl: true,
          },
        },
      },
    });

    if (!session || session.formId !== formId) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Update session status to consent_declined
    await db.annotationSession.update({
      where: { id: session.id },
      data: {
        status: "consent_declined",
        completedAt: new Date(),
      },
    });

    // Build redirect URL for panel provider
    const redirectUrl = buildPanelRedirectFromForm(session.form, session, "screenout");

    return NextResponse.json({
      success: true,
      redirectUrl,
    });
  } catch (error) {
    logError("Failed to decline session:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}
