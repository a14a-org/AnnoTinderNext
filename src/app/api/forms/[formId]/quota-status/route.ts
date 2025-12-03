import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  QuotaSettings,
  DEFAULT_QUOTA_SETTINGS,
  parseQuotaCounts,
} from "@/lib/quota-settings";

/**
 * GET - Get quota status overview for a form
 *
 * Returns:
 * - Total articles
 * - Quota targets per demographic group
 * - Completion stats per demographic group
 * - Per-article breakdown (optional, with ?detailed=true)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get("detailed") === "true";

    // Get form settings
    const form = await db.form.findUnique({
      where: { id: formId },
      select: {
        id: true,
        title: true,
        articlesPerSession: true,
        quotaSettings: true,
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Parse quota settings
    const quotaSettings: QuotaSettings = form.quotaSettings
      ? JSON.parse(form.quotaSettings)
      : DEFAULT_QUOTA_SETTINGS;

    // Get articles with quota counts
    const articles = await db.article.findMany({
      where: { formId },
      select: {
        id: true,
        shortId: true,
        quotaCounts: true,
        ...(detailed ? { text: true } : {}),
      },
      orderBy: { shortId: "asc" },
    });

    // Calculate stats per group
    const totalArticles = articles.length;
    const groupStats: Record<string, {
      target: number;
      complete: number;
      totalAnnotations: number;
    }> = {};

    // Initialize group stats
    for (const [groupName, config] of Object.entries(quotaSettings.groups)) {
      groupStats[groupName] = {
        target: config.target,
        complete: 0,
        totalAnnotations: 0,
      };
    }

    // Calculate per-article stats
    for (const article of articles) {
      const quotaCounts = parseQuotaCounts(article.quotaCounts);

      for (const [groupName, config] of Object.entries(quotaSettings.groups)) {
        const count = quotaCounts[groupName] || 0;
        groupStats[groupName].totalAnnotations += count;

        if (count >= config.target) {
          groupStats[groupName].complete++;
        }
      }
    }

    // Count fully complete articles (all groups met)
    const fullyComplete = articles.filter((article) => {
      const quotaCounts = parseQuotaCounts(article.quotaCounts);
      return Object.entries(quotaSettings.groups).every(
        ([groupName, config]) => (quotaCounts[groupName] || 0) >= config.target
      );
    }).length;

    // Get session stats
    const sessionStats = await db.annotationSession.groupBy({
      by: ["status", "demographicGroup"],
      where: { formId },
      _count: true,
    });

    // Format session stats
    const sessions = {
      total: 0,
      byStatus: {} as Record<string, number>,
      byDemographic: {} as Record<string, { total: number; completed: number }>,
    };

    // Initialize demographic session stats
    for (const groupName of Object.keys(quotaSettings.groups)) {
      sessions.byDemographic[groupName] = { total: 0, completed: 0 };
    }

    for (const stat of sessionStats) {
      sessions.total += stat._count;
      sessions.byStatus[stat.status] =
        (sessions.byStatus[stat.status] || 0) + stat._count;

      if (stat.demographicGroup && sessions.byDemographic[stat.demographicGroup]) {
        sessions.byDemographic[stat.demographicGroup].total += stat._count;
        if (stat.status === "completed") {
          sessions.byDemographic[stat.demographicGroup].completed += stat._count;
        }
      }
    }

    // Calculate overall progress
    const totalTargetAnnotations = totalArticles *
      Object.values(quotaSettings.groups).reduce((sum, g) => sum + g.target, 0);
    const totalActualAnnotations = Object.values(groupStats).reduce(
      (sum, g) => sum + g.totalAnnotations, 0
    );
    const overallProgress = totalTargetAnnotations > 0
      ? Math.round((totalActualAnnotations / totalTargetAnnotations) * 100)
      : 0;

    // Build progress per group
    const progressByGroup: Record<string, number> = {};
    for (const [groupName, stats] of Object.entries(groupStats)) {
      progressByGroup[groupName] = totalArticles > 0
        ? Math.round((stats.complete / totalArticles) * 100)
        : 0;
    }

    // Build quota targets
    const quotaTargets: Record<string, number> = {};
    for (const [groupName, config] of Object.entries(quotaSettings.groups)) {
      quotaTargets[groupName] = config.target;
    }

    // Calculate estimated participants
    const estimatedParticipants: Record<string, number> = { total: 0 };
    for (const [groupName, config] of Object.entries(quotaSettings.groups)) {
      const needed = totalArticles * config.target;
      estimatedParticipants[groupName] = needed;
      estimatedParticipants.total += needed;
    }

    const response: Record<string, unknown> = {
      form: {
        id: form.id,
        title: form.title,
        articlesPerSession: form.articlesPerSession,
        quotaTargets,
        groupByField: quotaSettings.groupByField,
      },
      articles: {
        total: totalArticles,
        fullyComplete,
        byGroup: Object.fromEntries(
          Object.entries(groupStats).map(([name, stats]) => [name, stats.complete])
        ),
        progress: {
          ...progressByGroup,
          overall: overallProgress,
        },
      },
      sessions,
      estimatedParticipants,
    };

    // Add detailed article breakdown if requested
    if (detailed) {
      response.articleDetails = articles.map((a) => {
        const quotaCounts = parseQuotaCounts(a.quotaCounts);
        const groups: Record<string, { count: number; target: number; complete: boolean }> = {};

        for (const [groupName, config] of Object.entries(quotaSettings.groups)) {
          const count = quotaCounts[groupName] || 0;
          groups[groupName] = {
            count,
            target: config.target,
            complete: count >= config.target,
          };
        }

        return {
          id: a.id,
          shortId: a.shortId,
          groups,
        };
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to get quota status:", error);
    return NextResponse.json(
      { error: "Failed to get quota status" },
      { status: 500 }
    );
  }
}
