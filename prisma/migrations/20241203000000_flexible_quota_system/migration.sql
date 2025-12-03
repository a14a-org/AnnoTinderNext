-- Flexible Quota System Migration
-- Converts hardcoded caucasian/minority fields to flexible JSON-based quota system

-- Step 1: Add new columns
ALTER TABLE "forms" ADD COLUMN "quotaSettings" TEXT;
ALTER TABLE "articles" ADD COLUMN "quotaCounts" TEXT DEFAULT '{}';

-- Step 2: Migrate form quota settings to JSON
-- This creates the quotaSettings JSON from the old hardcoded fields
UPDATE "forms" SET "quotaSettings" = json_object(
  'groupByField', 'ethnicity',
  'groups', json_object(
    'dutch', json_object(
      'values', json_array('Nederlands', 'Duits', 'Polls'),
      'target', COALESCE("caucasianQuotaTarget", 1)
    ),
    'minority', json_object(
      'values', json_array('Surinaams', 'Turks', 'Marokkaans', 'Antilliaans/Arubaans', 'Indonesisch', 'Anders'),
      'target', COALESCE("minorityQuotaTarget", 2)
    )
  )
);

-- Step 3: Migrate article quota counts to JSON
-- Converts caucasianCount and minorityCount to quotaCounts JSON
UPDATE "articles" SET "quotaCounts" = json_object(
  'dutch', COALESCE("caucasianCount", 0),
  'minority', COALESCE("minorityCount", 0)
);

-- Step 4: Update session demographic group names
UPDATE "annotation_sessions" SET "demographicGroup" = 'dutch' WHERE "demographicGroup" = 'caucasian';

-- Step 5: SQLite doesn't support DROP COLUMN directly in older versions
-- We'll use a table rebuild approach for forms

-- Recreate forms table without old columns
CREATE TABLE "forms_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "brandColor" TEXT DEFAULT '#FF5A5F',
    "buttonText" TEXT DEFAULT 'Start',
    "submitText" TEXT DEFAULT 'Submit',
    "isPublished" INTEGER NOT NULL DEFAULT 0,
    "allowMultiple" INTEGER NOT NULL DEFAULT 1,
    "showProgressBar" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "articlesPerSession" INTEGER NOT NULL DEFAULT 20,
    "sessionTimeoutMins" INTEGER NOT NULL DEFAULT 10,
    "quotaSettings" TEXT
);

INSERT INTO "forms_new" SELECT
    "id", "slug", "title", "description", "brandColor", "buttonText", "submitText",
    "isPublished", "allowMultiple", "showProgressBar", "createdAt", "updatedAt",
    "articlesPerSession", "sessionTimeoutMins", "quotaSettings"
FROM "forms";

DROP TABLE "forms";
ALTER TABLE "forms_new" RENAME TO "forms";

-- Recreate indexes for forms
CREATE UNIQUE INDEX "forms_slug_key" ON "forms"("slug");
CREATE INDEX "forms_slug_idx" ON "forms"("slug");
CREATE INDEX "forms_isPublished_idx" ON "forms"("isPublished");

-- Recreate articles table without old columns
CREATE TABLE "articles_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formId" TEXT NOT NULL,
    "shortId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "quotaCounts" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "articles_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "articles_new" SELECT
    "id", "formId", "shortId", "text", "quotaCounts", "createdAt", "updatedAt"
FROM "articles";

DROP TABLE "articles";
ALTER TABLE "articles_new" RENAME TO "articles";

-- Recreate indexes and constraints for articles
CREATE UNIQUE INDEX "articles_formId_shortId_key" ON "articles"("formId", "shortId");
CREATE INDEX "articles_formId_idx" ON "articles"("formId");
