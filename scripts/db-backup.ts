/**
 * Full logical DB backup via Prisma. Mirrors the format used by previous
 * `backups/full-db-logical-backup-*.json.gz` files: a single gzipped JSON
 * object keyed by table name with full row data.
 *
 * Usage: npx tsx scripts/db-backup.ts [optional-label]
 * Output: backups/full-db-logical-backup-<timestamp>[-label].json.gz
 */
import { gzipSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { PrismaClient } from "../src/generated/prisma/index.js";

const db = new PrismaClient();

async function main() {
  const label = process.argv[2] ? `-${process.argv[2]}` : "";
  const timestamp = new Date()
    .toISOString()
    .replace(/[T:]/g, "-")
    .replace(/\..+$/, "")
    .replace(/-/g, (m, i) => (i < 10 ? "-" : ""));
  const fileTs = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outDir = "backups";
  mkdirSync(outDir, { recursive: true });
  const outPath = `${outDir}/full-db-logical-backup-${fileTs}${label}.json.gz`;

  console.log(`Backing up to ${outPath}`);
  const startedAt = Date.now();

  // Pull every table. Keep this list explicit so a new model added to the
  // schema is a visible diff here.
  const [
    users,
    accounts,
    sessions,
    verificationTokens,
    forms,
    questions,
    questionOptions,
    formSubmissions,
    answers,
    jobSets,
    articles,
    annotationSessions,
    clientErrors,
    articleAnnotations,
  ] = await Promise.all([
    db.user.findMany(),
    db.account.findMany(),
    db.session.findMany(),
    db.verificationToken.findMany(),
    db.form.findMany(),
    db.question.findMany(),
    db.questionOption.findMany(),
    db.formSubmission.findMany(),
    db.answer.findMany(),
    db.jobSet.findMany(),
    db.article.findMany(),
    db.annotationSession.findMany(),
    db.clientError.findMany(),
    db.articleAnnotation.findMany(),
  ]);

  const dump = {
    snapshotAt: new Date().toISOString(),
    schemaVersion: "2026-05-14",
    counts: {
      users: users.length,
      accounts: accounts.length,
      sessions: sessions.length,
      verificationTokens: verificationTokens.length,
      forms: forms.length,
      questions: questions.length,
      questionOptions: questionOptions.length,
      formSubmissions: formSubmissions.length,
      answers: answers.length,
      jobSets: jobSets.length,
      articles: articles.length,
      annotationSessions: annotationSessions.length,
      clientErrors: clientErrors.length,
      articleAnnotations: articleAnnotations.length,
    },
    users,
    accounts,
    sessions,
    verificationTokens,
    forms,
    questions,
    questionOptions,
    formSubmissions,
    answers,
    jobSets,
    articles,
    annotationSessions,
    clientErrors,
    articleAnnotations,
  };

  const json = JSON.stringify(dump);
  const gz = gzipSync(json);
  writeFileSync(outPath, gz);

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`Wrote ${outPath} (${(gz.length / 1024 / 1024).toFixed(1)} MB compressed, ${(json.length / 1024 / 1024).toFixed(1)} MB JSON) in ${elapsed}s`);
  console.log("Row counts:");
  for (const [k, v] of Object.entries(dump.counts)) console.log(`  ${k.padEnd(22)} ${v}`);

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
