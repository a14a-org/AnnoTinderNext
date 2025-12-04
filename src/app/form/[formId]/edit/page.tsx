"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Reorder } from "framer-motion";
import { Heart, Loader2, Play, ShieldCheck, Users } from "lucide-react";

import {
  EditorHeader,
  SettingsPanel,
  QuestionCard,
  SpecialScreenCard,
  AddQuestionMenu,
  QuestionEditor,
} from "./components";
import { useFormEditor, useQuestionCrud } from "./hooks";

const FormEditorPage = () => {
  const params = useParams();
  const formId = params.formId as string;

  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const {
    form, isLoading, title, description, brandColor, isPublished,
    articlesPerSession, sessionTimeoutMins, quotaSettings,
    dynataEnabled, dynataReturnUrl, dynataBasicCode, saveStatus,
    setTitle, setDescription, setBrandColor,
    setArticlesPerSession, setSessionTimeoutMins, setQuotaSettings,
    setDynataEnabled, setDynataReturnUrl, setDynataBasicCode,
    setForm, fetchForm, togglePublish,
  } = useFormEditor(formId);

  const { addQuestion, updateQuestion, deleteQuestion, handleReorder } = useQuestionCrud({
    formId, form, setForm, fetchForm, setSelectedQuestion, setShowAddMenu,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-chili-coral" />
      </div>
    );
  }

  if (!form) return null;

  const regularQuestions = form.questions.filter(
    (q) => q.type !== "WELCOME_SCREEN" && q.type !== "THANK_YOU_SCREEN" && q.type !== "INFORMED_CONSENT" && q.type !== "DEMOGRAPHICS"
  );
  const welcomeScreen = form.questions.find((q) => q.type === "WELCOME_SCREEN");
  const informedConsent = form.questions.find((q) => q.type === "INFORMED_CONSENT");
  const demographics = form.questions.find((q) => q.type === "DEMOGRAPHICS");
  const thankYouScreen = form.questions.find((q) => q.type === "THANK_YOU_SCREEN");

  return (
    <div className="min-h-screen bg-canvas">
      <EditorHeader
        form={form}
        title={title}
        saveStatus={saveStatus}
        isPublished={isPublished}
        onTitleChange={setTitle}
        onToggleSettings={() => setShowSettings(!showSettings)}
        onTogglePublish={togglePublish}
      />

      <main className="max-w-5xl mx-auto px-6 py-8">
        {showSettings && (
          <SettingsPanel
            form={form}
            formId={formId}
            description={description}
            brandColor={brandColor}
            articlesPerSession={articlesPerSession}
            sessionTimeoutMins={sessionTimeoutMins}
            quotaSettings={quotaSettings}
            dynataEnabled={dynataEnabled}
            dynataReturnUrl={dynataReturnUrl}
            dynataBasicCode={dynataBasicCode}
            onDescriptionChange={setDescription}
            onBrandColorChange={setBrandColor}
            onArticlesPerSessionChange={setArticlesPerSession}
            onSessionTimeoutChange={setSessionTimeoutMins}
            onQuotaSettingsChange={setQuotaSettings}
            onDynataEnabledChange={setDynataEnabled}
            onDynataReturnUrlChange={setDynataReturnUrl}
            onDynataBasicCodeChange={setDynataBasicCode}
            onImport={fetchForm}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {welcomeScreen && (
              <SpecialScreenCard
                question={welcomeScreen}
                icon={Play}
                label="Welcome Screen"
                isSelected={selectedQuestion === welcomeScreen.id}
                onSelect={() => setSelectedQuestion(welcomeScreen.id)}
              />
            )}

            {informedConsent && (
              <SpecialScreenCard
                question={informedConsent}
                icon={ShieldCheck}
                label="Informed Consent"
                isSelected={selectedQuestion === informedConsent.id}
                onSelect={() => setSelectedQuestion(informedConsent.id)}
              />
            )}

            {demographics && (
              <SpecialScreenCard
                question={demographics}
                icon={Users}
                label="Demographics"
                isSelected={selectedQuestion === demographics.id}
                onSelect={() => setSelectedQuestion(demographics.id)}
              />
            )}

            <Reorder.Group axis="y" values={regularQuestions} onReorder={handleReorder} className="space-y-4">
              {regularQuestions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  index={index}
                  isSelected={selectedQuestion === question.id}
                  onSelect={() => setSelectedQuestion(question.id)}
                />
              ))}
            </Reorder.Group>

            <AddQuestionMenu
              isOpen={showAddMenu}
              onToggle={() => setShowAddMenu(!showAddMenu)}
              onAddQuestion={addQuestion}
            />

            {thankYouScreen && (
              <SpecialScreenCard
                question={thankYouScreen}
                icon={Heart}
                label="Thank You Screen"
                isSelected={selectedQuestion === thankYouScreen.id}
                onSelect={() => setSelectedQuestion(thankYouScreen.id)}
              />
            )}
          </div>

          <div className="lg:col-span-1">
            {selectedQuestion ? (
              <QuestionEditor
                key={selectedQuestion}
                question={form.questions.find((q) => q.id === selectedQuestion)!}
                onUpdate={(updates) => updateQuestion(selectedQuestion, updates)}
                onDelete={() => deleteQuestion(selectedQuestion)}
                articleCount={form._count?.articles || 0}
                articlesPerSession={articlesPerSession}
              />
            ) : (
              <div className="bg-gray-50 rounded-xl p-6 text-center text-obsidian-muted">
                <p>Select a question to edit</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default FormEditorPage;
