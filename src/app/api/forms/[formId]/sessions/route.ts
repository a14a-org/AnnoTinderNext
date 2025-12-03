import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET - Fetch sessions with stats for the Sessions Dashboard
 *
 * Query params:
 *   status: "all" | "completed" | "in_progress" | "screened_out" (default: "all")
 *   page: number (default: 1)
 *   limit: number (default: 50)
 *
 * Returns:
 *   - stats: count by status
 *   - sessions: paginated list
 *   - pagination: page info
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    // Verify form exists
    const form = await db.form.findUnique({
      where: { id: formId },
      select: { id: true, title: true },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Get counts by status
    const [
      completedCount,
      inProgressCount,
      screenedOutCount,
      expiredCount,
      totalCount,
    ] = await Promise.all([
      db.annotationSession.count({
        where: { formId, status: "completed" },
      }),
      db.annotationSession.count({
        where: { formId, status: { in: ["started", "demographics", "annotating"] } },
      }),
      db.annotationSession.count({
        where: { formId, status: "screened_out" },
      }),
      db.annotationSession.count({
        where: { formId, status: "expired" },
      }),
      db.annotationSession.count({
        where: { formId },
      }),
    ]);

    // Build status filter
    let statusWhere: { status?: string | { in: string[] } } = {};
    switch (statusFilter) {
      case "completed":
        statusWhere = { status: "completed" };
        break;
      case "in_progress":
        statusWhere = { status: { in: ["started", "demographics", "annotating"] } };
        break;
      case "screened_out":
        statusWhere = { status: "screened_out" };
        break;
      case "expired":
        statusWhere = { status: "expired" };
        break;
      case "all":
      default:
        // No filter
        break;
    }

    // Fetch sessions with pagination
    const sessions = await db.annotationSession.findMany({
      where: {
        formId,
        ...statusWhere,
      },
      include: {
        annotations: {
          select: { id: true },
        },
      },
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Transform sessions for response
    const sessionList = sessions.map((session) => ({
      id: session.id,
      externalPid: session.externalPid,
      status: session.status,
      gender: session.gender,
      ethnicity: session.ethnicity,
      ageRange: session.ageRange,
      demographicGroup: session.demographicGroup,
      articlesRequired: session.articlesRequired,
      articlesCompleted: session.articlesCompleted,
      annotationCount: session.annotations.length,
      startedAt: session.startedAt.toISOString(),
      lastActiveAt: session.lastActiveAt.toISOString(),
      completedAt: session.completedAt?.toISOString() || null,
    }));

    // Calculate filtered count for pagination
    const filteredCount =
      statusFilter === "all"
        ? totalCount
        : statusFilter === "completed"
        ? completedCount
        : statusFilter === "in_progress"
        ? inProgressCount
        : statusFilter === "screened_out"
        ? screenedOutCount
        : statusFilter === "expired"
        ? expiredCount
        : totalCount;

    return NextResponse.json({
      form: {
        id: form.id,
        title: form.title,
      },
      stats: {
        total: totalCount,
        completed: completedCount,
        inProgress: inProgressCount,
        screenedOut: screenedOutCount,
        expired: expiredCount,
      },
      sessions: sessionList,
      pagination: {
        page,
        limit,
        total: filteredCount,
        totalPages: Math.ceil(filteredCount / limit),
      },
      filter: statusFilter,
    });
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
