import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { logError } from "@/lib/logger";

/**
 * POST - Create a new session or resume existing one
 *
 * Body: {
 *   sessionToken?: string,  // For resuming
 *   externalPid?: string,   // Dynata participant ID
 *   returnUrl?: string,     // Dynata return URL
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const body = await request.json();
    const { sessionToken, externalPid, returnUrl } = body;

    // Get form with settings
    const form = await db.form.findUnique({
      where: { id: formId },
      select: {
        id: true,
        articlesPerSession: true,
        sessionTimeoutMins: true,
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Try to resume existing session
    if (sessionToken) {
      const existingSession = await db.annotationSession.findUnique({
        where: { sessionToken },
        include: {
          annotations: {
            select: {
              articleId: true,
              skipped: true,
            },
          },
        },
      });

      if (existingSession && existingSession.formId === formId) {
        // Check if session has expired
        const timeoutMs = form.sessionTimeoutMins * 60 * 1000;
        const lastActive = new Date(existingSession.lastActiveAt).getTime();
        const now = Date.now();
        const isExpired = now - lastActive > timeoutMs;

        if (isExpired && existingSession.status === "annotating") {
          // Resume the expired session instead of creating a new one
          // This preserves all existing annotations and allows the user to continue
          const resumedSession = await db.annotationSession.update({
            where: { id: existingSession.id },
            data: {
              lastActiveAt: new Date(),
              // Keep status as "annotating" - they can continue where they left off
            },
          });

          return NextResponse.json({
            session: {
              ...resumedSession,
              annotations: existingSession.annotations,
            },
            resumed: true,
            wasExpired: true,
            articlesCompleted: existingSession.annotations.length,
          });
        }

        // Session is still valid - update lastActiveAt
        await db.annotationSession.update({
          where: { id: existingSession.id },
          data: { lastActiveAt: new Date() },
        });

        return NextResponse.json({
          session: existingSession,
          resumed: true,
          articlesCompleted: existingSession.annotations.length,
        });
      }
    }

    // Create new session
    const session = await db.annotationSession.create({
      data: {
        formId,
        externalPid,
        returnUrl,
        articlesRequired: form.articlesPerSession,
        status: "started",
      },
    });

    return NextResponse.json({
      session,
      resumed: false,
    });
  } catch (error) {
    logError("Failed to create/resume session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}

/**
 * GET - Get session status by token
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const { searchParams } = new URL(request.url);
    const sessionToken = searchParams.get("token");

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Session token required" },
        { status: 400 }
      );
    }

    const session = await db.annotationSession.findUnique({
      where: { sessionToken },
      include: {
        annotations: {
          select: {
            id: true,
            articleId: true,
            skipped: true,
            createdAt: true,
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

    // Parse assigned articles if present
    const assignedArticleIds = session.assignedArticleIds
      ? JSON.parse(session.assignedArticleIds)
      : [];

    return NextResponse.json({
      session: {
        ...session,
        assignedArticleIds,
      },
    });
  } catch (error) {
    logError("Failed to get session:", error);
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 }
    );
  }
}
