-- CreateTable
CREATE TABLE "forms" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "brandColor" TEXT DEFAULT '#FF5A5F',
    "buttonText" TEXT DEFAULT 'Start',
    "submitText" TEXT DEFAULT 'Submit',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "allowMultiple" BOOLEAN NOT NULL DEFAULT true,
    "showProgressBar" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "articlesPerSession" INTEGER NOT NULL DEFAULT 20,
    "sessionTimeoutMins" INTEGER NOT NULL DEFAULT 10,
    "quotaSettings" TEXT,
    "dynataEnabled" BOOLEAN NOT NULL DEFAULT false,
    "dynataReturnUrl" TEXT,
    "dynataBasicCode" TEXT,

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "placeholder" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "settings" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_submissions" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "annotationSessionId" TEXT,

    CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answers" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "textValue" TEXT,
    "numberValue" DOUBLE PRECISION,
    "booleanValue" BOOLEAN,
    "dateValue" TIMESTAMP(3),
    "jsonValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "shortId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "quotaCounts" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annotation_sessions" (
    "id" TEXT NOT NULL,
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
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "annotation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_annotations" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "selectedText" TEXT,
    "sentenceIndex" INTEGER,
    "startIndex" INTEGER,
    "endIndex" INTEGER,
    "followUpType" TEXT,
    "followUpAnswer" TEXT,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_annotations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "forms_slug_key" ON "forms"("slug");

-- CreateIndex
CREATE INDEX "forms_slug_idx" ON "forms"("slug");

-- CreateIndex
CREATE INDEX "forms_isPublished_idx" ON "forms"("isPublished");

-- CreateIndex
CREATE INDEX "questions_formId_idx" ON "questions"("formId");

-- CreateIndex
CREATE INDEX "questions_displayOrder_idx" ON "questions"("displayOrder");

-- CreateIndex
CREATE INDEX "question_options_questionId_idx" ON "question_options"("questionId");

-- CreateIndex
CREATE INDEX "question_options_displayOrder_idx" ON "question_options"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "form_submissions_annotationSessionId_key" ON "form_submissions"("annotationSessionId");

-- CreateIndex
CREATE INDEX "form_submissions_formId_idx" ON "form_submissions"("formId");

-- CreateIndex
CREATE INDEX "form_submissions_submittedAt_idx" ON "form_submissions"("submittedAt");

-- CreateIndex
CREATE INDEX "answers_submissionId_idx" ON "answers"("submissionId");

-- CreateIndex
CREATE INDEX "answers_questionId_idx" ON "answers"("questionId");

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

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_annotationSessionId_fkey" FOREIGN KEY ("annotationSessionId") REFERENCES "annotation_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "form_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annotation_sessions" ADD CONSTRAINT "annotation_sessions_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_annotations" ADD CONSTRAINT "article_annotations_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "annotation_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_annotations" ADD CONSTRAINT "article_annotations_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
