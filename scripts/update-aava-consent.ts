/**
 * Update AAVA form INFORMED_CONSENT question settings:
 * - Merge two checkboxes into one combined checkbox (J1: single click consent)
 *
 * Run with: npx tsx scripts/update-aava-consent.ts
 */

import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

const AAVA_FORM_SLUG = "aava";

const updateConsentCheckboxes = async () => {
  console.log("Finding AAVA form INFORMED_CONSENT question...\n");

  let form = await prisma.form.findFirst({
    where: { slug: AAVA_FORM_SLUG },
    select: { id: true, title: true },
  });

  if (!form) {
    form = await prisma.form.findFirst({
      where: { title: { contains: "AAVA", mode: "insensitive" } },
      select: { id: true, title: true },
    });
  }

  if (!form) {
    // List all forms to help identify the right one
    const allForms = await prisma.form.findMany({
      select: { id: true, title: true, slug: true },
    });
    console.log("Available forms:");
    allForms.forEach((f) => console.log(`  - "${f.title}" (slug: ${f.slug}, id: ${f.id})`));
    console.error("\nCould not find AAVA form");
    process.exit(1);
  }

  console.log(`Found form: "${form.title}" (${form.id})\n`);

  const consentQuestion = await prisma.question.findFirst({
    where: {
      formId: form!.id,
      type: "INFORMED_CONSENT",
    },
    select: { id: true, title: true, settings: true },
  });

  if (!consentQuestion) {
    console.error("No INFORMED_CONSENT question found on this form");
    process.exit(1);
  }

  console.log(`Found consent question: "${consentQuestion.title}" (${consentQuestion.id})`);

  const rawSettings = consentQuestion.settings;
  const settings: Record<string, unknown> =
    typeof rawSettings === "string" ? JSON.parse(rawSettings) : (rawSettings as Record<string, unknown>) ?? {};
  const currentCheckboxes = settings.consentCheckboxes as
    | { id: string; label: string; required: boolean }[]
    | undefined;

  console.log("\nCurrent checkboxes:");
  if (currentCheckboxes) {
    currentCheckboxes.forEach((cb, i) =>
      console.log(`  ${i + 1}. [${cb.required ? "required" : "optional"}] ${cb.label}`)
    );
  } else {
    console.log("  (using defaults)");
  }

  const newCheckboxes: { id: string; label: string; required: boolean }[] = [];

  console.log("\nNew checkboxes: (none — single-click agree)");

  const updatedSettings = {
    ...settings,
    consentCheckboxes: newCheckboxes,
  };

  await prisma.question.update({
    where: { id: consentQuestion.id },
    data: {
      settings: typeof rawSettings === "string"
        ? JSON.stringify(updatedSettings)
        : updatedSettings,
    },
  });

  console.log("\n✓ Consent checkboxes updated successfully");
};

updateConsentCheckboxes()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
