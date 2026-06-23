/**
 * Configure the AAVA form for the final ~200 native-Dutch top-up wave.
 *
 * Decisions baked in (confirmed 2026-06-23):
 *   - NO demographic screenout. Everyone who consents + passes the age gate is
 *     admitted; the Motivaction list size is the only cap.
 *   - Reuse the existing AAVA form (minority wave is finished, saturated).
 *   - Keep the under-18 age gate (handled in assign/route.ts, not here).
 *   - Keep ALL demographic questions, including the conditional
 *     `hasOtherEthnicBackground` follow-up on "Nederlands". It no longer gates
 *     anything, but its answer is still useful individual-differences data and is
 *     persisted automatically by richDemographicFields() in the assign route.
 *
 * This script therefore makes exactly ONE DB change (snapshotted before writing):
 *
 *   quotaSettings → a single catch-all group `dutch_w3` (a FRESH key, so it starts
 *   at 0 on every job set's quotaCounts and is additive on top of the existing
 *   `dutch`/`minority` history). `values` lists every ethnicity option so
 *   classifyParticipant() always matches → the "no matching group" screenout can
 *   never fire. `target` is effectively unlimited → quota-full never fires.
 *
 * The DEMOGRAPHICS question is read for verification only and left untouched.
 *
 * Dry run:  npx tsx scripts/aava-dutch-wave-config.ts
 * Apply:    npx tsx scripts/aava-dutch-wave-config.ts --apply
 */

import { mkdirSync, writeFileSync } from "fs";
import { PrismaClient } from "../src/generated/prisma/index.js";

const db = new PrismaClient();
const FORM_SLUG = "aava-1766572857546";
const APPLY = process.argv.includes("--apply");

// Fresh quota key for this wave. Starts at 0 on every job set (additive on top of
// the historical `dutch` counts of 3-7), so it does not block the new arrivals.
const NEW_GROUP_KEY = "dutch_w3";

// Effectively unlimited: with ~200 participants this is never reached, so no
// participant is ever turned away by quota. The Motivaction list is the real cap.
const UNLIMITED_TARGET = 1_000_000;

// Every ethnicity option the form offers (lowercased), plus the legacy values
// `duits`/`pools`, so classifyParticipant() matches everyone and never returns null.
// classifyParticipant also matches "anders: <free text>" via its startsWith check.
const ALL_ETHNICITY_VALUES = [
  "nederlands",
  "marokkaans",
  "turks",
  "surinaams",
  "antilliaans/caribisch",
  "indonesisch",
  "gemengd",
  "anders",
  "zeg ik liever niet",
  "duits",
  "pools",
];

interface DemographicField {
  id: string;
  optionFollowUps?: Record<string, unknown>;
  [key: string]: unknown;
}
interface DemographicsSettings {
  fields: DemographicField[];
  [key: string]: unknown;
}
interface QuotaSettings {
  groupByField: string;
  groups: Record<string, { values: string[]; target: number }>;
}

const parse = <T>(raw: unknown): T => {
  if (raw === null || raw === undefined) return {} as T;
  if (typeof raw === "string") return JSON.parse(raw) as T;
  return raw as T;
};

async function main() {
  const form = await db.form.findUnique({
    where: { slug: FORM_SLUG },
    select: { id: true, slug: true, title: true, quotaSettings: true },
  });
  if (!form) throw new Error(`form not found: ${FORM_SLUG}`);

  // Read the DEMOGRAPHICS question for verification only — we do NOT modify it.
  const demoQ = await db.question.findFirst({
    where: { formId: form.id, type: "DEMOGRAPHICS" },
    select: { id: true, settings: true },
  });
  const demo = parse<DemographicsSettings>(demoQ?.settings ?? null);
  const ethField = (demo.fields ?? []).find((f) => f.id === "ethnicity");
  const followUpStillPresent = Boolean(ethField?.optionFollowUps?.Nederlands);

  // The one change: quota → single catch-all group, fresh key, unlimited target.
  const quotaBefore = parse<QuotaSettings>(form.quotaSettings ?? "{}");
  const quotaAfter: QuotaSettings = {
    groupByField: "ethnicity",
    groups: {
      [NEW_GROUP_KEY]: { values: ALL_ETHNICITY_VALUES, target: UNLIMITED_TARGET },
    },
  };

  // Snapshot before any write.
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  mkdirSync("backups", { recursive: true });
  const snapshotPath = `backups/aava-dutch-wave-quota-${ts}.json`;
  writeFileSync(
    snapshotPath,
    JSON.stringify(
      {
        snapshotAt: new Date().toISOString(),
        formSlug: form.slug,
        formTitle: form.title,
        quotaSettingsBefore: quotaBefore,
        quotaSettingsAfter: quotaAfter,
        demographicsQuestionId: demoQ?.id ?? null,
        note: "Demographics question left untouched; snapshot is for record only.",
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`Snapshot → ${snapshotPath}\n`);

  console.log("=== Quota settings (the only change) ===");
  console.log(`  before groups: ${Object.keys(quotaBefore.groups ?? {}).join(", ") || "(none)"}`);
  console.log(`  after  groups: ${Object.keys(quotaAfter.groups).join(", ")} (target ${UNLIMITED_TARGET})`);
  console.log(`  fresh key '${NEW_GROUP_KEY}' starts at 0 on every job set → additive, no cap.\n`);

  console.log("=== Demographics (UNCHANGED — verification only) ===");
  console.log(`  fields: ${(demo.fields ?? []).map((f) => f.id).join(", ")}`);
  console.log(`  hasOtherEthnicBackground follow-up kept: ${followUpStillPresent}`);
  console.log(`  (its answer is still saved as data; it just no longer screens anyone out)\n`);

  if (!APPLY) {
    console.log("(dry run — pass --apply to write quotaSettings)");
    await db.$disconnect();
    return;
  }

  await db.form.update({
    where: { id: form.id },
    data: { quotaSettings: JSON.stringify(quotaAfter) },
  });

  const verifyForm = await db.form.findUnique({
    where: { id: form.id },
    select: { quotaSettings: true },
  });
  console.log("Applied. Reading back:");
  console.log(`  quotaSettings: ${verifyForm?.quotaSettings}`);

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
