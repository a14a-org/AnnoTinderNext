/**
 * Migration script to convert hardcoded quota fields to flexible JSON format
 *
 * Run with: npx ts-node scripts/migrate-quota-data.ts
 * Or after building: node dist/scripts/migrate-quota-data.js
 */

import { PrismaClient } from "../src/generated/prisma";
import { DEFAULT_QUOTA_SETTINGS, QuotaSettings } from "../src/features/quota";

const prisma = new PrismaClient();

async function migrateQuotaData() {
  console.log("Starting quota data migration...\n");

  // Migrate Forms
  console.log("Migrating Form quota settings...");
  const forms = await prisma.$queryRaw<
    Array<{
      id: string;
      caucasianQuotaTarget: number | null;
      minorityQuotaTarget: number | null;
      quotaSettings: string | null;
    }>
  >`SELECT id, caucasianQuotaTarget, minorityQuotaTarget, quotaSettings FROM forms`;

  for (const form of forms) {
    // Skip if already migrated
    if (form.quotaSettings) {
      console.log(`  Form ${form.id}: Already has quotaSettings, skipping`);
      continue;
    }

    // Create new quota settings from old fields
    const quotaSettings: QuotaSettings = {
      ...DEFAULT_QUOTA_SETTINGS,
      groups: {
        dutch: {
          values: DEFAULT_QUOTA_SETTINGS.groups.dutch.values,
          target: form.caucasianQuotaTarget ?? 1,
        },
        minority: {
          values: DEFAULT_QUOTA_SETTINGS.groups.minority.values,
          target: form.minorityQuotaTarget ?? 2,
        },
      },
    };

    await prisma.form.update({
      where: { id: form.id },
      data: { quotaSettings: JSON.stringify(quotaSettings) },
    });

    console.log(`  Form ${form.id}: Migrated (dutch: ${quotaSettings.groups.dutch.target}, minority: ${quotaSettings.groups.minority.target})`);
  }

  // Migrate Articles
  console.log("\nMigrating Article quota counts...");
  const articles = await prisma.$queryRaw<
    Array<{
      id: string;
      caucasianCount: number | null;
      minorityCount: number | null;
      quotaCounts: string | null;
    }>
  >`SELECT id, caucasianCount, minorityCount, quotaCounts FROM articles`;

  let migratedCount = 0;
  let skippedCount = 0;

  for (const article of articles) {
    // Skip if already migrated (has non-empty quotaCounts)
    if (article.quotaCounts && article.quotaCounts !== "{}") {
      skippedCount++;
      continue;
    }

    // Create new quota counts from old fields
    const quotaCounts: Record<string, number> = {};
    if (article.caucasianCount && article.caucasianCount > 0) {
      quotaCounts.dutch = article.caucasianCount;
    }
    if (article.minorityCount && article.minorityCount > 0) {
      quotaCounts.minority = article.minorityCount;
    }

    await prisma.article.update({
      where: { id: article.id },
      data: { quotaCounts: JSON.stringify(quotaCounts) },
    });

    migratedCount++;
  }

  console.log(`  Migrated: ${migratedCount}, Skipped: ${skippedCount}`);

  // Migrate AnnotationSessions - update demographicGroup values
  console.log("\nMigrating AnnotationSession demographic groups...");
  const sessions = await prisma.annotationSession.findMany({
    where: {
      demographicGroup: { in: ["caucasian", "minority"] },
    },
    select: { id: true, demographicGroup: true },
  });

  for (const session of sessions) {
    const newGroup = session.demographicGroup === "caucasian" ? "dutch" : "minority";
    await prisma.annotationSession.update({
      where: { id: session.id },
      data: { demographicGroup: newGroup },
    });
  }

  console.log(`  Migrated ${sessions.length} sessions`);

  console.log("\nMigration complete!");
}

migrateQuotaData()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
