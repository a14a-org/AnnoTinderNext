import type { QuotaSettings } from "@/features/quota";

import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  DEFAULT_QUOTA_SETTINGS,
  parseQuotaCounts,
} from "@/features/quota";

/**
 * Parse a single CSV line, handling quoted values
 */
const parseCSVLine = (line: string, delimiter: string = ","): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
};

/**
 * Parse CSV content into article records
 * Expects columns: text, ARTICLE_SHORT_ID (or shortId)
 */
const parseCSV = (csvContent: string): Array<{ text: string; shortId: string }> => {
  const lines = csvContent.trim().split("\n");
  if (lines.length < 2) return [];

  // Parse header row - handle both comma and semicolon delimiters
  const delimiter = lines[0].includes(";") ? ";" : ",";
  const headers = parseCSVLine(lines[0], delimiter).map((h) =>
    h.toLowerCase().trim()
  );

  // Find column indices
  const textIndex = headers.findIndex(
    (h) => h === "text" || h === "tekst"
  );
  const shortIdIndex = headers.findIndex(
    (h) =>
      h === "article_short_id" ||
      h === "shortid" ||
      h === "short_id" ||
      h === "id"
  );

  if (textIndex === -1) {
    throw new Error("CSV must have a 'text' or 'tekst' column");
  }

  return lines.slice(1)
    .map((line, index) => {
      const values = parseCSVLine(line, delimiter);
      const text = values[textIndex]?.trim();

      if (!text) return null;

      // Use shortId from CSV or generate one
      const shortId =
        shortIdIndex !== -1 && values[shortIdIndex]
          ? values[shortIdIndex].trim()
          : `article-${index + 1}`;

      return { text, shortId };
    })
    .filter((article): article is { text: string; shortId: string } => article !== null);
};

// GET - List articles for a form
export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) => {
  try {
    const { formId } = await params;

    const articles = await db.article.findMany({
      where: { formId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        shortId: true,
        text: true,
        quotaCounts: true,
        createdAt: true,
      },
    });

    // Get form quota settings for context
    const form = await db.form.findUnique({
      where: { id: formId },
      select: {
        quotaSettings: true,
      },
    });

    const quotaSettings: QuotaSettings = form?.quotaSettings
      ? JSON.parse(form.quotaSettings)
      : DEFAULT_QUOTA_SETTINGS;

    // Build quota targets from settings using Object.fromEntries
    const quotaTargets = Object.fromEntries(
      Object.entries(quotaSettings.groups).map(([groupName, config]) => [
        groupName,
        config.target
      ])
    );

    // Transform articles to include parsed quotaCounts
    const transformedArticles = articles.map((article) => ({
      ...article,
      quotaCounts: parseQuotaCounts(article.quotaCounts),
    }));

    return NextResponse.json({
      articles: transformedArticles,
      totalCount: articles.length,
      quotaTargets,
      groupByField: quotaSettings.groupByField,
    });
  } catch (error) {
    console.error("Failed to fetch articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
};

// POST - Import articles from CSV
export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) => {
  try {
    const { formId } = await params;
    const body = await request.json();
    const { csv, replaceExisting = false } = body;

    if (!csv || typeof csv !== "string") {
      return NextResponse.json(
        { error: "CSV content is required" },
        { status: 400 }
      );
    }

    // Verify form exists
    const form = await db.form.findUnique({
      where: { id: formId },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Parse CSV
    let articles;
    try {
      articles = parseCSV(csv);
    } catch (parseError) {
      return NextResponse.json(
        { error: parseError instanceof Error ? parseError.message : "Failed to parse CSV" },
        { status: 400 }
      );
    }

    if (articles.length === 0) {
      return NextResponse.json(
        { error: "No valid articles found in CSV" },
        { status: 400 }
      );
    }

    // Optionally delete existing articles
    if (replaceExisting) {
      await db.article.deleteMany({
        where: { formId },
      });
    }

    // Insert articles (upsert to handle duplicates)
    const results = await Promise.all(
      articles.map((article) =>
        db.article.upsert({
          where: {
            formId_shortId: {
              formId,
              shortId: article.shortId,
            },
          },
          create: {
            formId,
            shortId: article.shortId,
            text: article.text,
          },
          update: {
            text: article.text,
          },
        })
      )
    );

    return NextResponse.json(
      {
        success: true,
        imported: results.length,
        message: `Successfully imported ${results.length} articles`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to import articles:", error);
    return NextResponse.json(
      { error: "Failed to import articles" },
      { status: 500 }
    );
  }
};

// DELETE - Remove all articles for a form
export const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) => {
  try {
    const { formId } = await params;

    const deleted = await db.article.deleteMany({
      where: { formId },
    });

    return NextResponse.json({
      success: true,
      deleted: deleted.count,
    });
  } catch (error) {
    console.error("Failed to delete articles:", error);
    return NextResponse.json(
      { error: "Failed to delete articles" },
      { status: 500 }
    );
  }
};
