-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formId" TEXT NOT NULL,
    "shortId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "caucasianCount" INTEGER NOT NULL DEFAULT 0,
    "minorityCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "articles_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "annotation_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formId" TEXT NOT NULL,
    "externalPid" TEXT,
    "returnUrl" TEXT,
    "sessionToken" TEXT NOT NULL,
    "gender" TEXT,
    "ethnicity" TEXT,
    "ageRange" TEXT,
    "demographicGroup" TEXT,
    "assignedArticleIds" TEXT,
    "articlesRequired" INTEGER NOT NULL DEFAULT 20,
    "articlesCompleted" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'started',
    "lastActiveAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "annotation_sessions_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "article_annotations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "selectedText" TEXT,
    "sentenceIndex" INTEGER,
    "startIndex" INTEGER,
    "endIndex" INTEGER,
    "followUpType" TEXT,
    "followUpAnswer" TEXT,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "article_annotations_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "annotation_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "article_annotations_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_forms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "brandColor" TEXT DEFAULT '#FF5A5F',
    "buttonText" TEXT DEFAULT 'Start',
    "submitText" TEXT DEFAULT 'Submit',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "allowMultiple" BOOLEAN NOT NULL DEFAULT true,
    "showProgressBar" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "articlesPerSession" INTEGER NOT NULL DEFAULT 20,
    "caucasianQuotaTarget" INTEGER NOT NULL DEFAULT 1,
    "minorityQuotaTarget" INTEGER NOT NULL DEFAULT 2,
    "sessionTimeoutMins" INTEGER NOT NULL DEFAULT 10
);
INSERT INTO "new_forms" ("allowMultiple", "brandColor", "buttonText", "createdAt", "description", "id", "isPublished", "showProgressBar", "slug", "submitText", "title", "updatedAt") SELECT "allowMultiple", "brandColor", "buttonText", "createdAt", "description", "id", "isPublished", "showProgressBar", "slug", "submitText", "title", "updatedAt" FROM "forms";
DROP TABLE "forms";
ALTER TABLE "new_forms" RENAME TO "forms";
CREATE UNIQUE INDEX "forms_slug_key" ON "forms"("slug");
CREATE INDEX "forms_slug_idx" ON "forms"("slug");
CREATE INDEX "forms_isPublished_idx" ON "forms"("isPublished");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "articles_formId_idx" ON "articles"("formId");

-- CreateIndex
CREATE UNIQUE INDEX "articles_formId_shortId_key" ON "articles"("formId", "shortId");

-- CreateIndex
CREATE UNIQUE INDEX "annotation_sessions_sessionToken_key" ON "annotation_sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "annotation_sessions_formId_demographicGroup_status_idx" ON "annotation_sessions"("formId", "demographicGroup", "status");

-- CreateIndex
CREATE INDEX "annotation_sessions_sessionToken_idx" ON "annotation_sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "article_annotations_sessionId_idx" ON "article_annotations"("sessionId");

-- CreateIndex
CREATE INDEX "article_annotations_articleId_idx" ON "article_annotations"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "article_annotations_sessionId_articleId_key" ON "article_annotations"("sessionId", "articleId");
