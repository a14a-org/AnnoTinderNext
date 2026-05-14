/**
 * Recover the 1,689 sessions stuck at status="annotating" with 3/4 articles
 * annotated because they were assigned to set-360 (which has only 3 articles,
 * not the form-wide 4 articlesPerSession).
 *
 * For each eligible session:
 *   - status: "annotating" → "completed"
 *   - articlesRequired: 4 → 3 (match the actual jobSet)
 *   - completedAt: lastActiveAt (best available proxy)
 *
 * Also: increment set-360's quotaCounts to reflect the recovered completions.
 *
 * Eligibility (precise):
 *   - formId = AAVA form id
 *   - jobSetId = the 3-article jobSet
 *   - status = "annotating"
 *   - articlesCompleted >= 3 (proves they did all available work)
 *
 * Default mode: dry-run (prints what would be done, writes nothing).
 * Apply mode:   pass --apply as the only argument.
 *
 * Writes a JSON audit file to backups/ with the exact list of session IDs
 * touched and their before/after state.
 */
import { writeFileSync } from "node:fs";
import { PrismaClient, Prisma } from "../src/generated/prisma/index.js";

const db = new PrismaClient();
const FORM_SLUG = "aava-1766572857546";
const BROKEN_JOBSET_ID = "cmjjw9rnq01nvmw0j5k52h1le"; // set-360
const APPLY = process.argv.includes("--apply");

interface QuotaCounts {
  [demographicGroup: string]: number;
}

function parseCounts(s: string | null): QuotaCounts {
  if (!s) return {};
  try {
    return JSON.parse(s) as QuotaCounts;
  } catch {
    return {};
  }
}

async function main() {
  console.log(APPLY ? "=== APPLY MODE (will write to DB) ===" : "=== DRY RUN (no writes) — pass --apply to commit ===");

  const form = await db.form.findUnique({ where: { slug: FORM_SLUG }, select: { id: true } });
  if (!form) throw new Error("form not found");

  // Verify the broken jobSet has the expected shape
  const jobSet = await db.jobSet.findUnique({
    where: { id: BROKEN_JOBSET_ID },
    select: {
      id: true,
      shortId: true,
      formId: true,
      quotaCounts: true,
      articles: { select: { id: true, shortId: true } },
    },
  });
  if (!jobSet || jobSet.formId !== form.id) throw new Error("broken jobSet not found / wrong form");
  if (jobSet.articles.length !== 3) {
    throw new Error(`expected ${BROKEN_JOBSET_ID} to have 3 articles, found ${jobSet.articles.length} — refusing to proceed`);
  }
  console.log(`Confirmed jobSet ${jobSet.shortId} has 3 articles: ${jobSet.articles.map((a) => a.shortId).join(", ")}`);

  // Find eligible sessions
  const eligible = await db.annotationSession.findMany({
    where: {
      formId: form.id,
      jobSetId: BROKEN_JOBSET_ID,
      status: "annotating",
      articlesCompleted: { gte: 3 },
    },
    select: {
      id: true,
      status: true,
      articlesCompleted: true,
      articlesRequired: true,
      demographicGroup: true,
      lastActiveAt: true,
      completedAt: true,
    },
  });

  console.log(`\nEligible sessions: ${eligible.length}`);

  // Sanity: every eligible session should have demographicGroup non-null (otherwise quota update has no key)
  const withGroup = eligible.filter((s) => s.demographicGroup);
  const withoutGroup = eligible.filter((s) => !s.demographicGroup);
  console.log(`  with demographicGroup:    ${withGroup.length}`);
  console.log(`  WITHOUT demographicGroup: ${withoutGroup.length}`);
  if (withoutGroup.length > 0) {
    console.log(`  (these still get marked completed but won't contribute to quota counts)`);
    console.log(`  sample missing-group session: ${withoutGroup[0].id}`);
  }

  // Sanity: articlesCompleted should be exactly 3 (not more)
  const histo = new Map<number, number>();
  for (const s of eligible) histo.set(s.articlesCompleted, (histo.get(s.articlesCompleted) ?? 0) + 1);
  console.log(`  articlesCompleted distribution among eligible:`);
  for (const [k, v] of [...histo.entries()].sort()) console.log(`    ${k}: ${v}`);

  // Compute quota deltas
  const groupDelta = new Map<string, number>();
  for (const s of withGroup) {
    const g = s.demographicGroup!;
    groupDelta.set(g, (groupDelta.get(g) ?? 0) + 1);
  }
  const currentQuota = parseCounts(jobSet.quotaCounts);
  const newQuota: QuotaCounts = { ...currentQuota };
  for (const [g, delta] of groupDelta) newQuota[g] = (newQuota[g] || 0) + delta;
  console.log(`\nQuota changes on jobSet ${jobSet.shortId}:`);
  console.log(`  current quotaCounts: ${JSON.stringify(currentQuota)}`);
  console.log(`  delta:               ${JSON.stringify(Object.fromEntries(groupDelta))}`);
  console.log(`  resulting:           ${JSON.stringify(newQuota)}`);

  // Audit file — saved regardless of mode
  const auditPath = `backups/stuck-recovery-audit-${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}.json`;
  const audit = {
    snapshotAt: new Date().toISOString(),
    mode: APPLY ? "apply" : "dry-run",
    jobSetId: BROKEN_JOBSET_ID,
    jobSetShortId: jobSet.shortId,
    quotaBefore: currentQuota,
    quotaAfter: newQuota,
    quotaDelta: Object.fromEntries(groupDelta),
    sessions: eligible.map((s) => ({
      id: s.id,
      beforeStatus: s.status,
      beforeArticlesRequired: s.articlesRequired,
      beforeCompletedAt: s.completedAt?.toISOString() ?? null,
      articlesCompleted: s.articlesCompleted,
      demographicGroup: s.demographicGroup,
      lastActiveAt: s.lastActiveAt.toISOString(),
      newCompletedAt: s.lastActiveAt.toISOString(),
    })),
  };
  writeFileSync(auditPath, JSON.stringify(audit, null, 2));
  console.log(`\nAudit file written: ${auditPath}`);

  if (!APPLY) {
    console.log("\nDry run complete. Re-run with --apply to commit changes.");
    await db.$disconnect();
    return;
  }

  // Apply phase. Single bulk SQL update + a jobSet update, both inside a
  // transaction. Sequential per-row updates exceeded the transaction
  // timeout earlier (1,689 rows × ~30ms each = ~50s, over the cap).
  const eligibleIds = eligible.map((s) => s.id);
  console.log(`\nApplying bulk update for ${eligibleIds.length} sessions + jobSet quota update in a transaction...`);
  const startedAt = Date.now();
  await db.$transaction(
    async (tx) => {
      const updated = await tx.$executeRaw`
        UPDATE annotation_sessions
        SET status = 'completed',
            "articlesRequired" = 3,
            "completedAt" = "lastActiveAt"
        WHERE id = ANY(${eligibleIds}::text[])
          AND "jobSetId" = ${BROKEN_JOBSET_ID}
          AND status = 'annotating'
          AND "articlesCompleted" >= 3
      `;
      console.log(`  bulk session update: ${updated} rows affected`);
      if (updated !== eligibleIds.length) {
        throw new Error(`Expected ${eligibleIds.length} rows updated, got ${updated}. Aborting (transaction rolls back).`);
      }
      await tx.jobSet.update({
        where: { id: BROKEN_JOBSET_ID },
        data: { quotaCounts: JSON.stringify(newQuota) },
      });
    },
    { timeout: 60000, isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`Committed in ${elapsed}s.`);

  // Verification queries
  const stillStuck = await db.annotationSession.count({
    where: {
      formId: form.id,
      jobSetId: BROKEN_JOBSET_ID,
      status: "annotating",
      articlesCompleted: { gte: 3 },
    },
  });
  const nowCompleted = await db.annotationSession.count({
    where: { formId: form.id, jobSetId: BROKEN_JOBSET_ID, status: "completed" },
  });
  console.log(`\nPost-write verification:`);
  console.log(`  set-360 sessions still stuck (>=3, annotating): ${stillStuck}`);
  console.log(`  set-360 sessions now completed:                 ${nowCompleted}`);
  const finalJobSet = await db.jobSet.findUnique({ where: { id: BROKEN_JOBSET_ID }, select: { quotaCounts: true } });
  console.log(`  set-360 quotaCounts now: ${finalJobSet?.quotaCounts}`);

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
