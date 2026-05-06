/**
 * Apply Zilin's Q5 redesign on the AAVA form:
 *   - Reorder the ethnicity options (Marokkaans first, Nederlands last)
 *   - Add a conditional follow-up that only appears when "Nederlands" is selected:
 *       "Heb je, naast je Nederlandse achtergrond, ook een andere etnische achtergrond?"
 *       - "Ja, namelijk: ___" → continue (treated as minority by the assign route)
 *       - "Nee"               → screen out (handled in the assign route)
 *   - Add "zeg ik liever niet" to the minority quota group so participants who
 *     decline to answer are admitted instead of being silently screened out
 *     (matches Zilin's "everyone continues except the explicit Nee screen-outs").
 *
 * Snapshots both the DEMOGRAPHICS question settings and the form's quotaSettings
 * to backups/ before any DB write.
 *
 * Dry run:  npx tsx scripts/aava-demographics-update.ts
 * Apply:    npx tsx scripts/aava-demographics-update.ts --apply
 */

import { mkdirSync, writeFileSync } from "fs";
import { PrismaClient } from "../src/generated/prisma/index.js";

const db = new PrismaClient();
const FORM_SLUG = "aava-1766572857546";
const APPLY = process.argv.includes("--apply");

const NEW_ETHNICITY_OPTIONS = [
  "Marokkaans",
  "Turks",
  "Surinaams",
  "Antilliaans/Caribisch",
  "Indonesisch",
  "Gemengd",
  "Anders",
  "Zeg ik liever niet",
  "Nederlands",
];

const FOLLOW_UP_FIELD = {
  id: "hasOtherEthnicBackground",
  label:
    "Heb je, naast je Nederlandse achtergrond, ook een andere etnische achtergrond?",
  type: "single_choice_other",
  options: ["Ja, namelijk", "Nee"],
  otherOptionValue: "Ja, namelijk",
  required: true,
};

interface DemographicField {
  id: string;
  label?: string;
  type?: string;
  options?: string[];
  otherOptionValue?: string;
  required?: boolean;
  optionFollowUps?: Record<string, unknown[]>;
  [key: string]: unknown;
}

interface DemographicsSettings {
  fields: DemographicField[];
  [key: string]: unknown;
}

interface QuotaGroup {
  values: string[];
  target: number;
}

interface QuotaSettings {
  groupByField: string;
  groups: Record<string, QuotaGroup>;
}

const parseSettings = <T>(raw: unknown): T => {
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

  const consent = await db.question.findFirst({
    where: { formId: form.id, type: "DEMOGRAPHICS" },
    select: { id: true, title: true, settings: true, updatedAt: true },
  });
  if (!consent) throw new Error("DEMOGRAPHICS question not found on form");

  const wasString = typeof consent.settings === "string";
  const before = parseSettings<DemographicsSettings>(consent.settings);
  const beforeFields = Array.isArray(before.fields) ? before.fields : [];
  const ethBefore = beforeFields.find((f) => f.id === "ethnicity");
  if (!ethBefore) throw new Error("ethnicity field not found in DEMOGRAPHICS settings");

  // Build the new ethnicity field
  const ethAfter: DemographicField = {
    ...ethBefore,
    type: "single_choice_other",
    options: NEW_ETHNICITY_OPTIONS,
    otherOptionValue: "Anders",
    optionFollowUps: {
      Nederlands: [FOLLOW_UP_FIELD],
    },
  };

  const after: DemographicsSettings = {
    ...before,
    fields: beforeFields.map((f) => (f.id === "ethnicity" ? ethAfter : f)),
  };

  // Quota settings: add "zeg ik liever niet" to minority so the no-screen path holds
  const beforeQuota = parseSettings<QuotaSettings>(form.quotaSettings ?? "{}");
  const afterQuota: QuotaSettings = JSON.parse(JSON.stringify(beforeQuota));
  if (afterQuota.groups?.minority) {
    const minorityValues = new Set(afterQuota.groups.minority.values.map((v) => v.toLowerCase()));
    minorityValues.add("zeg ik liever niet");
    afterQuota.groups.minority.values = [...minorityValues];
  }

  // Snapshot
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  mkdirSync("backups", { recursive: true });
  const snapshotPath = `backups/aava-demographics-${consent.id}-${ts}.json`;
  writeFileSync(
    snapshotPath,
    JSON.stringify(
      {
        snapshotAt: new Date().toISOString(),
        formSlug: form.slug,
        formTitle: form.title,
        questionId: consent.id,
        questionUpdatedAt: consent.updatedAt.toISOString(),
        settingsStoredAsString: wasString,
        demographicsSettings: before,
        quotaSettings: beforeQuota,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`Snapshot → ${snapshotPath}\n`);

  console.log("=== Ethnicity option order ===");
  console.log(`  before: ${(ethBefore.options ?? []).join(", ")}`);
  console.log(`  after:  ${ethAfter.options.join(", ")}\n`);
  console.log("=== Conditional follow-up on 'Nederlands' ===");
  console.log(`  ${FOLLOW_UP_FIELD.label}`);
  console.log(`  options: ${FOLLOW_UP_FIELD.options.join(" | ")}`);
  console.log(`  Ja branch lets the participant continue (treated as minority).`);
  console.log(`  Nee branch screens the participant out.\n`);
  console.log("=== Quota minority values ===");
  console.log(`  before: ${beforeQuota.groups?.minority?.values?.join(", ") ?? "(no minority group)"}`);
  console.log(`  after:  ${afterQuota.groups?.minority?.values?.join(", ") ?? "(no minority group)"}\n`);

  if (!APPLY) {
    console.log("(dry run — pass --apply to write)");
    await db.$disconnect();
    return;
  }

  await db.question.update({
    where: { id: consent.id },
    data: { settings: wasString ? JSON.stringify(after) : after },
  });
  await db.form.update({
    where: { id: form.id },
    data: { quotaSettings: JSON.stringify(afterQuota) },
  });

  console.log("Applied. Reading back:");
  const verifyQ = await db.question.findUnique({
    where: { id: consent.id },
    select: { settings: true, updatedAt: true },
  });
  const verifyF = await db.form.findUnique({
    where: { id: form.id },
    select: { quotaSettings: true },
  });
  const verifyParsedQ = parseSettings<DemographicsSettings>(verifyQ?.settings ?? null);
  const verifyEth = (Array.isArray(verifyParsedQ.fields) ? verifyParsedQ.fields : []).find(
    (f) => f.id === "ethnicity",
  );
  console.log(`  ethnicity options:        ${(verifyEth?.options ?? []).join(", ")}`);
  console.log(`  has Nederlands follow-up: ${Boolean(verifyEth?.optionFollowUps?.Nederlands)}`);
  console.log(`  question updatedAt:       ${verifyQ?.updatedAt.toISOString()}`);
  console.log(`  quotaSettings:            ${verifyF?.quotaSettings}`);

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
