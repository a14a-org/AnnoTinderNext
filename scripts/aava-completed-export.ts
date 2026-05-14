/**
 * Full export of COMPLETED sessions on the AAVA form, mirroring the Apr 15
 * export schema exactly so Mo's existing notebooks keep working:
 *   aava_articles.csv
 *   aava_sessions.csv
 *   aava_annotations.csv
 *   aava_full.json
 *
 * All CSVs use semicolon (;) as delimiter.
 *
 * Usage: npx tsx scripts/aava-completed-export.ts
 */

import { writeFileSync } from "fs";
import { PrismaClient } from "../src/generated/prisma/index.js";

const db = new PrismaClient();
const FORM_SLUG = "aava-1766572857546";
const DELIM = ";";

const csvField = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(DELIM) || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

// Sentence count: split on ., ! or ? followed by whitespace (matches the
// segment_index regex used in the Apr 15 export README).
const countSentences = (text: string): number => {
  const parts = text.split(/[.!?]+\s+/);
  return parts.filter((p) => p.trim().length > 0).length;
};

async function main() {
  const form = await db.form.findUnique({
    where: { slug: FORM_SLUG },
    select: { id: true, title: true, slug: true },
  });
  if (!form) throw new Error("not found");

  // === Articles (all articles on the form, regardless of who annotated) ===
  const articles = await db.article.findMany({
    where: { formId: form.id },
    select: {
      shortId: true,
      text: true,
      jobSet: { select: { shortId: true } },
    },
    orderBy: { shortId: "asc" },
  });
  console.log(`Articles on form: ${articles.length}`);

  const articlesCsv = [
    ["article_short_id", "job_set_id", "article_text", "num_sentences"]
      .map(csvField)
      .join(DELIM),
    ...articles.map((a) =>
      [a.shortId, a.jobSet?.shortId ?? "", a.text, countSentences(a.text)]
        .map(csvField)
        .join(DELIM),
    ),
  ].join("\n");
  writeFileSync("exports/aava_articles.csv", articlesCsv + "\n");
  console.log(`Wrote → exports/aava_articles.csv`);

  // === Sessions (status = completed) ===
  const sessions = await db.annotationSession.findMany({
    where: { formId: form.id, status: "completed" },
    include: {
      annotations: {
        include: { article: { select: { shortId: true } } },
        orderBy: { createdAt: "asc" },
      },
      formSubmission: {
        include: {
          answers: {
            include: { question: { select: { id: true, title: true, type: true } } },
          },
        },
      },
      jobSet: { select: { shortId: true } },
    },
    orderBy: { completedAt: "asc" },
  });
  console.log(`Completed sessions: ${sessions.length}`);

  // Pull rich demographics from the AnnotationSession columns. These were added
  // 2026-05-13 (commit added rich demographic persistence in /session/assign).
  // For sessions completed before that fix, the columns are null.
  // Falls back to the legacy DEMOGRAPHICS Answer row (textValue JSON string) for
  // the 6 historical sessions that went through the public-submit endpoint.
  const richDemo = (s: (typeof sessions)[number]) => {
    const out: Record<string, string | number | boolean | null> = {
      birth_date: s.birthDate ?? null,
      education: s.education ?? null,
      political_orientation: s.politicalOrientation ?? null,
      religion: s.religion ?? null,
      feeling_general: s.feelingGeneral ?? null,
      feeling_other_ethnicity: s.feelingOtherEthnicity ?? null,
      discrimination_experience: s.discriminationExperience ?? null,
    };
    if (out.birth_date !== null) return out;
    // Legacy fallback: parse from formSubmission DEMOGRAPHICS answer.
    if (!s.formSubmission) return out;
    for (const a of s.formSubmission.answers) {
      if (a.question?.type === "DEMOGRAPHICS") {
        const raw = a.jsonValue ?? a.textValue;
        if (!raw) continue;
        try {
          const obj = (typeof raw === "string" ? JSON.parse(raw) : raw) as Record<string, unknown>;
          if (obj.birthDate !== undefined) out.birth_date = obj.birthDate as string;
          if (obj.education !== undefined) out.education = obj.education as string;
          if (obj.politicalOrientation !== undefined) out.political_orientation = obj.politicalOrientation as number;
          if (obj.religion !== undefined) out.religion = obj.religion as string;
          if (obj.feelingGeneral !== undefined) out.feeling_general = obj.feelingGeneral as number;
          if (obj.feelingOtherEthnicity !== undefined) out.feeling_other_ethnicity = obj.feelingOtherEthnicity as number;
          if (obj.discriminationExperience !== undefined) out.discrimination_experience = obj.discriminationExperience as string;
        } catch {
          /* ignore malformed */
        }
      }
    }
    return out;
  };

  const sessionsHeader = [
    "session_id",
    "demographic_group",
    "gender",
    "ethnicity",
    "age_range",
    "panel_source",
    "external_pid",
    "job_set_id",
    "started_at",
    "completed_at",
    "articles_completed",
    "articles_required",
    "birth_date",
    "education",
    "political_orientation",
    "religion",
    "feeling_general",
    "feeling_other_ethnicity",
    "discrimination_experience",
  ];
  const sessionsRows = sessions.map((s) => {
    const d = richDemo(s);
    return [
      s.id,
      s.demographicGroup ?? "",
      s.gender ?? "",
      s.ethnicity ?? "",
      s.ageRange ?? "",
      s.panelSource ?? "",
      s.externalPid ?? "",
      s.jobSet?.shortId ?? "",
      s.startedAt.toISOString(),
      s.completedAt?.toISOString() ?? "",
      s.articlesCompleted,
      s.articlesRequired,
      d.birth_date ?? "",
      d.education ?? "",
      d.political_orientation ?? "",
      d.religion ?? "",
      d.feeling_general ?? "",
      d.feeling_other_ethnicity ?? "",
      d.discrimination_experience ?? "",
    ];
  });
  const sessionsCsv = [
    sessionsHeader.map(csvField).join(DELIM),
    ...sessionsRows.map((r) => r.map(csvField).join(DELIM)),
  ].join("\n");
  writeFileSync("exports/aava_sessions.csv", sessionsCsv + "\n");
  console.log(`Wrote ${sessionsRows.length} sessions → exports/aava_sessions.csv`);

  // === Annotations (only from completed sessions) ===
  const annHeader = [
    "session_id",
    "article_short_id",
    "skipped",
    "created_at",
    "selection_index",
    "selected_text",
    "segment_index",
    "start_index",
    "end_index",
    "followup_reason",
  ];
  const annRows: string[][] = [];
  for (const s of sessions) {
    s.annotations.forEach((a, idx) => {
      let reason = "";
      if (a.followUpAnswer) {
        try {
          const parsed = JSON.parse(a.followUpAnswer) as Record<string, unknown>;
          reason = String(parsed.reason ?? parsed["migrated-q1"] ?? "");
        } catch {
          reason = a.followUpAnswer;
        }
      }
      annRows.push([
        s.id,
        a.article?.shortId ?? "",
        a.skipped ? "True" : "False",
        a.createdAt.toISOString(),
        String(idx),
        a.selectedText ?? "",
        a.segmentIndex !== null && a.segmentIndex !== undefined ? String(a.segmentIndex) : "",
        a.startIndex !== null && a.startIndex !== undefined ? String(a.startIndex) : "",
        a.endIndex !== null && a.endIndex !== undefined ? String(a.endIndex) : "",
        reason,
      ]);
    });
  }
  const annCsv = [
    annHeader.map(csvField).join(DELIM),
    ...annRows.map((r) => r.map(csvField).join(DELIM)),
  ].join("\n");
  writeFileSync("exports/aava_annotations.csv", annCsv + "\n");
  console.log(`Wrote ${annRows.length} annotation rows → exports/aava_annotations.csv`);

  // === Nested JSON ===
  const json = {
    formId: form.id,
    formSlug: form.slug,
    formTitle: form.title,
    exportedAt: new Date().toISOString(),
    description: "Full data for COMPLETED sessions on the AAVA form (status = completed).",
    totals: {
      articles: articles.length,
      completedSessions: sessions.length,
      annotationRows: annRows.length,
    },
    articles: articles.map((a) => ({
      articleShortId: a.shortId,
      jobSetShortId: a.jobSet?.shortId ?? null,
      articleText: a.text,
      numSentences: countSentences(a.text),
    })),
    sessions: sessions.map((s) => {
      const d = richDemo(s);
      return {
        sessionId: s.id,
        demographicGroup: s.demographicGroup,
        gender: s.gender,
        ethnicity: s.ethnicity,
        ageRange: s.ageRange,
        panelSource: s.panelSource,
        externalPid: s.externalPid,
        jobSetShortId: s.jobSet?.shortId ?? null,
        startedAt: s.startedAt.toISOString(),
        completedAt: s.completedAt?.toISOString() ?? null,
        articlesCompleted: s.articlesCompleted,
        articlesRequired: s.articlesRequired,
        demographics: d,
        annotations: s.annotations.map((a, idx) => ({
          selectionIndex: idx,
          articleShortId: a.article?.shortId ?? null,
          skipped: a.skipped,
          createdAt: a.createdAt.toISOString(),
          selectedText: a.selectedText,
          segmentIndex: a.segmentIndex,
          startIndex: a.startIndex,
          endIndex: a.endIndex,
          followUpAnswer: a.followUpAnswer ? (() => { try { return JSON.parse(a.followUpAnswer); } catch { return a.followUpAnswer; } })() : null,
        })),
      };
    }),
  };
  writeFileSync("exports/aava_full.json", JSON.stringify(json, null, 2) + "\n");
  console.log(`Wrote nested JSON → exports/aava_full.json`);

  // Per-panel breakdown
  const byPanel = new Map<string, number>();
  for (const s of sessions) {
    const k = s.panelSource ?? "(empty/legacy)";
    byPanel.set(k, (byPanel.get(k) ?? 0) + 1);
  }
  console.log("\nCompleted sessions per panel:");
  for (const [k, n] of [...byPanel.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(18)} ${n}`);
  }

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
