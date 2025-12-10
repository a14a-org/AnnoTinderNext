import type { QuotaSettings } from "@/features/quota";

import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireFormOwnership } from "@/lib/auth";
import {
  DEFAULT_QUOTA_SETTINGS,
  parseQuotaCounts,
} from "@/features/quota";

/**
 * GET - Get quota status overview for a form (requires ownership)
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
    const { error } = await requireFormOwnership(formId);
    if (error) return error;

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

    // Initialize group stats using Object.fromEntries
    const initialGroupStats = Object.fromEntries(
      Object.entries(quotaSettings.groups).map(([groupName, config]) => [
        groupName,
        { target: config.target, complete: 0, totalAnnotations: 0 }
      ])
    ) as Record<string, { target: number; complete: number; totalAnnotations: number }>;

    // Calculate per-article stats using reduce
    const groupStats = articles.reduce((stats, article) => {
      const quotaCounts = parseQuotaCounts(article.quotaCounts);

      Object.entries(quotaSettings.groups).forEach(([groupName, config]) => {
        const count = quotaCounts[groupName] || 0;
        stats[groupName].totalAnnotations += count;
        if (count >= config.target) {
          stats[groupName].complete++;
        }
      });

      return stats;
    }, initialGroupStats);

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

    // Initialize demographic session stats using Object.fromEntries
    sessions.byDemographic = Object.fromEntries(
      Object.keys(quotaSettings.groups).map((groupName) => [
        groupName,
        { total: 0, completed: 0 }
      ])
    );

    // Aggregate session stats using reduce
    sessionStats.reduce((acc, stat) => {
      acc.total += stat._count;
      acc.byStatus[stat.status] = (acc.byStatus[stat.status] || 0) + stat._count;

      if (stat.demographicGroup && acc.byDemographic[stat.demographicGroup]) {
        acc.byDemographic[stat.demographicGroup].total += stat._count;
        if (stat.status === "completed") {
          acc.byDemographic[stat.demographicGroup].completed += stat._count;
        }
      }

      return acc;
    }, sessions);

    // Calculate overall progress
    const totalTargetAnnotations = totalArticles *
      Object.values(quotaSettings.groups).reduce((sum, g) => sum + g.target, 0);
    const totalActualAnnotations = Object.values(groupStats).reduce(
      (sum, g) => sum + g.totalAnnotations, 0
    );
    const overallProgress = totalTargetAnnotations > 0
      ? Math.round((totalActualAnnotations / totalTargetAnnotations) * 100)
      : 0;

    // Build progress per group using Object.fromEntries
    const progressByGroup = Object.fromEntries(
      Object.entries(groupStats).map(([groupName, stats]) => [
        groupName,
        totalArticles > 0 ? Math.round((stats.complete / totalArticles) * 100) : 0
      ])
    );

    // Build quota targets using Object.fromEntries
    const quotaTargets = Object.fromEntries(
      Object.entries(quotaSettings.groups).map(([groupName, config]) => [
        groupName,
        config.target
      ])
    );

    // Calculate estimated participants using reduce
    const groupParticipants = Object.fromEntries(
      Object.entries(quotaSettings.groups).map(([groupName, config]) => [
        groupName,
        totalArticles * config.target
      ])
    );
    const estimatedParticipants: Record<string, number> = {
      ...groupParticipants,
      total: Object.values(groupParticipants).reduce((sum, n) => sum + n, 0)
    };

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
        const groups = Object.fromEntries(
          Object.entries(quotaSettings.groups).map(([groupName, config]) => {
            const count = quotaCounts[groupName] || 0;
            return [groupName, {
              count,
              target: config.target,
              complete: count >= config.target,
            }];
          })
        );

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
