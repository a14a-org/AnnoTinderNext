"use client";

import type { Annotation, TextAnnotationSettings } from "@/features/annotation";
import type { DemographicAnswers, DemographicsSettings } from "@/features/demographics";
import type { InformedConsentSettings } from "@/features/informed-consent";
import type { InstructionsSettings } from "@/features/instructions";
import type { AssignedArticle, SessionData } from "./types";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, ChevronRight, Loader2 } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";

import { AnnotationDisplay } from "@/components/molecules/AnnotationDisplay";
import { Button, ErrorBoundary } from "@/components/ui";
import { apiPost } from "@/lib/api";
import { buildDynataRedirect } from "@/lib/dynata";
import { letterToIndex } from "@/lib/keyboard-shortcuts";
import { DEFAULT_BRAND_COLOR } from "@/config/theme";
import { DEFAULT_DEMOGRAPHICS_SETTINGS, DemographicsDisplay } from "@/features/demographics";
import {
  ConsentDeclinedDisplay,
  InformedConsentDisplay,
} from "@/features/informed-consent/components/informed-consent-display";
import { InstructionsDisplay } from "@/features/instructions/components/instructions-display";

import {
  FormCompleteDisplay,
  KeyboardHint,
  NavigationButtons,
  ProgressBar,
  QuestionInput,
  ScreenedOutDisplay,
} from "./components";
import { useFormData, useUrlParams, useFormAnswers, useFormNavigation } from "./hooks";

const PublicFormPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const isPreview = searchParams.get("preview") === "true";

  // Custom hooks for form management
  const { form, isLoading, error: loadError } = useFormData(slug);
  const { externalPid, returnUrl } = useUrlParams();
  const { answers, setAnswer, setAnswers, canProceed } = useFormAnswers();

  const maxIndex = form ? form.questions.length - 1 : 0;
  const currentQuestion = form?.questions[0];
  const isThankYou = currentQuestion?.type === "THANK_YOU_SCREEN";

  const { currentIndex, direction, navigateTo, goPrevious } = useFormNavigation(maxIndex, isThankYou);

  // Local state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startedAt] = useState(new Date().toISOString());
  const [consentDeclined, setConsentDeclined] = useState(false);
  const [session, setSession] = useState<SessionData | null>(null);
  const [assignedArticles, setAssignedArticles] = useState<AssignedArticle[]>([]);
  const [screenedOut, setScreenedOut] = useState(false);
  const [screenOutReason, setScreenOutReason] = useState<string | null>(null);
  const [isProcessingDemographics, setIsProcessingDemographics] = useState(false);

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Current question info
  const activeQuestion = form?.questions[currentIndex];
  const isWelcome = activeQuestion?.type === "WELCOME_SCREEN";
  const isActiveThankYou = activeQuestion?.type === "THANK_YOU_SCREEN";
  const isInformedConsent = activeQuestion?.type === "INFORMED_CONSENT";
  const isDemographics = activeQuestion?.type === "DEMOGRAPHICS";
  const isInstructions = activeQuestion?.type === "INSTRUCTIONS";
  const isTextAnnotation = activeQuestion?.type === "TEXT_ANNOTATION";
  const isSpecialScreen = isInformedConsent || isDemographics || isInstructions || isTextAnnotation;

  // Progress calculation
  const totalQuestions = form?.questions.filter(
    (q) => q.type !== "WELCOME_SCREEN" && q.type !== "THANK_YOU_SCREEN"
  ).length || 0;
  const answeredQuestions = form?.questions.filter(
    (q) =>
      q.type !== "WELCOME_SCREEN" &&
      q.type !== "THANK_YOU_SCREEN" &&
      answers[q.id] !== undefined &&
      answers[q.id] !== null &&
      answers[q.id] !== ""
  ).length || 0;
  const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  const brandColor = form?.brandColor || DEFAULT_BRAND_COLOR;

  // Can proceed check
  const canProceedNow = useCallback(() => {
    if (isWelcome || isActiveThankYou) return true;
    return canProceed(activeQuestion, isSpecialScreen);
  }, [activeQuestion, isWelcome, isActiveThankYou, isSpecialScreen, canProceed]);

  // Consent handlers
  const handleConsentAgree = useCallback(() => {
    if (!activeQuestion) return;
    setAnswer(activeQuestion.id, true);
    navigateTo(currentIndex + 1, 1);
  }, [activeQuestion, currentIndex, navigateTo, setAnswer]);

  const handleConsentDecline = useCallback(() => {
    if (!activeQuestion) return;
    setAnswer(activeQuestion.id, false);
    setConsentDeclined(true);

    // Redirect to Dynata with screenout status (rst=2) if enabled
    if (form?.dynataEnabled && form?.dynataReturnUrl) {
      const redirectUrl = buildDynataRedirect(
        form.dynataReturnUrl,
        externalPid,
        "screenout",
        form.dynataBasicCode
      );
      // Small delay to show the decline message before redirecting
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 2000);
    }
  }, [activeQuestion, setAnswer, form, externalPid]);

  // Demographics handler
  const handleDemographicsComplete = useCallback(async (demographicAnswers: DemographicAnswers) => {
    if (!activeQuestion || !form || isProcessingDemographics) return;
    setIsProcessingDemographics(true);

    setAnswer(activeQuestion.id, JSON.stringify(demographicAnswers));

    // Create session
    const sessionResult = await apiPost<{ session: SessionData }>(
      `/api/forms/${form.id}/session${isPreview ? "?preview=true" : ""}`,
      { externalPid, returnUrl }
    );

    if (!sessionResult.ok) {
      setError(sessionResult.error || "Failed to create session");
      setIsProcessingDemographics(false);
      return;
    }

    const sessionData = sessionResult.data;
    setSession(sessionData.session);

    if (typeof window !== "undefined") {
      localStorage.setItem(`session_${slug}`, sessionData.session.sessionToken);
    }

    // Assign articles
    const assignResult = await apiPost<{ articles: AssignedArticle[]; session: SessionData }>(
      `/api/forms/${form.id}/session/assign${isPreview ? "?preview=true" : ""}`,
      { sessionToken: sessionData.session.sessionToken, demographics: demographicAnswers }
    );

    if (!assignResult.ok) {
      if (assignResult.status === 409) {
        setScreenedOut(true);
        setScreenOutReason(assignResult.error || "quota_full");
        // Redirect to Dynata with quota_full status (rst=3) if enabled
        if (form.dynataEnabled && form.dynataReturnUrl) {
          const redirectUrl = buildDynataRedirect(
            form.dynataReturnUrl,
            externalPid,
            "quota_full",
            form.dynataBasicCode
          );
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 2000);
        } else if (returnUrl) {
          // Fallback to legacy returnUrl handling
          const redirectUrl = new URL(returnUrl);
          redirectUrl.searchParams.set("status", "quota_full");
          if (externalPid) redirectUrl.searchParams.set("pid", externalPid);
          window.location.href = redirectUrl.toString();
        }
        setIsProcessingDemographics(false);
        return;
      }
      setError(assignResult.error || "Failed to assign articles");
      setIsProcessingDemographics(false);
      return;
    }

    setAssignedArticles(assignResult.data.articles || []);
    setSession(assignResult.data.session);
    navigateTo(currentIndex + 1, 1);
    setIsProcessingDemographics(false);
  }, [activeQuestion, form, externalPid, returnUrl, slug, isProcessingDemographics, currentIndex, navigateTo, setAnswer, isPreview]);

  // Instructions handler
  const handleInstructionsContinue = useCallback(() => {
    if (!activeQuestion) return;
    setAnswer(activeQuestion.id, true);
    navigateTo(currentIndex + 1, 1);
  }, [activeQuestion, currentIndex, navigateTo, setAnswer]);

  // Annotation handler
  const handleAnnotationComplete = useCallback(async (annotations: Annotation[]) => {
    if (!activeQuestion || !form) return;

    const newAnswers = { ...answers, [activeQuestion.id]: JSON.stringify(annotations) };
    setAnswers(newAnswers);

    const thankYouIndex = form.questions.findIndex((q) => q.type === "THANK_YOU_SCREEN");
    const isLastBeforeThankYou = thankYouIndex > 0 && currentIndex === thankYouIndex - 1;
    const isLastQuestion = currentIndex === form.questions.length - 1;
    const shouldSubmit = (isLastBeforeThankYou || isLastQuestion) && !isSubmitted;

    if (shouldSubmit) {
      setIsSubmitting(true);
      const { ok, error } = await apiPost(`/api/forms/public/${slug}${isPreview ? "?preview=true" : ""}`, {
        answers: newAnswers,
        startedAt,
        sessionToken: session?.sessionToken,
      });

      if (ok) {
        setIsSubmitted(true);
        if (thankYouIndex >= 0) navigateTo(thankYouIndex, 1);
      } else {
        setError(error || "Failed to submit");
      }
      setIsSubmitting(false);
      return;
    }

    if (currentIndex < form.questions.length - 1) {
      navigateTo(currentIndex + 1, 1);
    }
  }, [activeQuestion, form, currentIndex, answers, isSubmitted, slug, startedAt, session, navigateTo, setAnswers, isPreview]);

  // Submit/next handler
  const goNext = useCallback(async () => {
    if (!form || !canProceedNow()) return;

    const thankYouIndex = form.questions.findIndex((q) => q.type === "THANK_YOU_SCREEN");
    const lastSubmittableIndex = thankYouIndex >= 0 ? thankYouIndex - 1 : form.questions.length - 1;
    const isLastQuestion = currentIndex === lastSubmittableIndex;

    if (isLastQuestion && !isSubmitted) {
      setIsSubmitting(true);
      const { ok, error } = await apiPost(`/api/forms/public/${slug}${isPreview ? "?preview=true" : ""}`, {
        answers,
        startedAt,
        sessionToken: session?.sessionToken,
      });

      if (ok) {
        setIsSubmitted(true);
        if (thankYouIndex >= 0) navigateTo(thankYouIndex, 1);
      } else {
        setError(error || "Failed to submit");
      }
      setIsSubmitting(false);
      return;
    }

    if (currentIndex < form.questions.length - 1) {
      navigateTo(currentIndex + 1, 1);
    }
  }, [form, currentIndex, answers, startedAt, slug, canProceedNow, isSubmitted, session, navigateTo, isPreview]);

  // Focus input when question changes
  useEffect(() => {
    if (inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeQuestion || isLoading || consentDeclined) return;

      if (e.key === "Enter" && !e.shiftKey) {
        if (!isSpecialScreen && activeQuestion.type !== "LONG_TEXT" && canProceedNow() && !isSubmitting) {
          e.preventDefault();
          goNext();
        }
      }

      if (e.key === "Escape" && !isWelcome && !isSpecialScreen) {
        goPrevious();
      }

      // Letter shortcuts for choice questions
      if (activeQuestion.type === "MULTIPLE_CHOICE" || activeQuestion.type === "DROPDOWN") {
        const index = letterToIndex(e.key);
        if (index !== null && index < activeQuestion.options.length) {
          setAnswer(activeQuestion.id, activeQuestion.options[index].value);
        }
      }

      if (activeQuestion.type === "CHECKBOXES") {
        const index = letterToIndex(e.key);
        if (index !== null && index < activeQuestion.options.length) {
          const optionValue = activeQuestion.options[index].value;
          const currentAnswer = (answers[activeQuestion.id] as string[]) || [];
          const newAnswer = currentAnswer.includes(optionValue)
            ? currentAnswer.filter((v) => v !== optionValue)
            : [...currentAnswer, optionValue];
          setAnswer(activeQuestion.id, newAnswer);
        }
      }

      if (activeQuestion.type === "YES_NO") {
        if (e.key.toLowerCase() === "y") setAnswer(activeQuestion.id, true);
        if (e.key.toLowerCase() === "n") setAnswer(activeQuestion.id, false);
      }

      if (activeQuestion.type === "RATING") {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 5) setAnswer(activeQuestion.id, num);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeQuestion, isLoading, isSubmitting, isWelcome, isSpecialScreen, consentDeclined, answers, canProceedNow, goNext, goPrevious, setAnswer]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: brandColor }} />
      </div>
    );
  }

  // Error state
  if (loadError || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-obsidian mb-2">{loadError || error}</h1>
          <p className="text-obsidian-muted">This form may not exist or is not available.</p>
        </div>
      </div>
    );
  }

  if (!form || !activeQuestion) return null;

  if (consentDeclined) {
    const consentQuestion = form.questions.find((q) => q.type === "INFORMED_CONSENT");
    const willRedirect = !!(form?.dynataEnabled && form?.dynataReturnUrl);
    return (
      <div className="min-h-screen bg-canvas flex flex-col">
        <main className="flex-1 flex items-center justify-center px-6 py-16">
          <ConsentDeclinedDisplay
            settings={consentQuestion?.settings as InformedConsentSettings | null}
            brandColor={brandColor}
            willRedirect={willRedirect}
          />
        </main>
      </div>
    );
  }

  if (screenedOut) {
    const willRedirect = !!(form?.dynataEnabled && form?.dynataReturnUrl) || !!returnUrl;
    return <ScreenedOutDisplay reason={screenOutReason} returnUrl={returnUrl} willRedirect={willRedirect} />;
  }

  const showProgressBar = form.showProgressBar && !isWelcome && !isActiveThankYou && !isSpecialScreen;
  const showNavigation = !isWelcome && !isSpecialScreen && !isSubmitted;
  const showKeyboardHint = !isActiveThankYou && !isSpecialScreen && !isSubmitted;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-canvas flex flex-col">
        {showProgressBar && <ProgressBar progress={progress} brandColor={brandColor} />}

        {showNavigation && (
          <NavigationButtons
            currentIndex={currentIndex}
            isThankYou={isActiveThankYou}
            canProceed={canProceedNow()}
            isSubmitting={isSubmitting}
            onPrevious={goPrevious}
            onNext={goNext}
          />
        )}

        {showKeyboardHint && <KeyboardHint />}

        <main className="flex-1 flex items-center justify-center px-6 py-16">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeQuestion.id}
              initial={{ opacity: 0, x: direction * 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -50 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-full max-w-2xl"
            >
              {isWelcome && (
              <div className="text-center">
                <h1 className="text-4xl font-display font-bold text-obsidian mb-4">{activeQuestion.title}</h1>
                {activeQuestion.description && <p className="text-lg text-obsidian-muted mb-8">{activeQuestion.description}</p>}
                <Button
                  onClick={goNext}
                  className="text-lg px-8 py-3 cursor-pointer transition-all hover:brightness-110 active:brightness-90"
                  style={{ backgroundColor: brandColor }}
                >
                  {form.buttonText || "Start"}
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}

            {isActiveThankYou && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: brandColor }}>
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl font-display font-bold text-obsidian mb-4">{activeQuestion.title}</h1>
                {activeQuestion.description && <p className="text-lg text-obsidian-muted">{activeQuestion.description}</p>}
              </div>
            )}

            {isInformedConsent && (
              <InformedConsentDisplay
                title={activeQuestion.title}
                description={activeQuestion.description}
                settings={activeQuestion.settings as InformedConsentSettings | null}
                brandColor={brandColor}
                onAgree={handleConsentAgree}
                onDecline={handleConsentDecline}
              />
            )}

            {isDemographics && (
              <DemographicsDisplay
                settings={(activeQuestion.settings as unknown as DemographicsSettings) || DEFAULT_DEMOGRAPHICS_SETTINGS}
                brandColor={brandColor}
                onComplete={handleDemographicsComplete}
                disabled={isProcessingDemographics}
              />
            )}

            {isInstructions && (
              <InstructionsDisplay
                title={activeQuestion.title}
                description={activeQuestion.description}
                settings={activeQuestion.settings as InstructionsSettings | null}
                brandColor={brandColor}
                onContinue={handleInstructionsContinue}
              />
            )}

            {isTextAnnotation && activeQuestion.settings && !isSubmitted && (
              <div>
                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-display font-bold text-obsidian mb-2">{activeQuestion.title}</h2>
                  {activeQuestion.description && <p className="text-obsidian-muted">{activeQuestion.description}</p>}
                </div>
                <AnnotationDisplay
                  settings={{
                    ...(activeQuestion.settings as unknown as TextAnnotationSettings),
                    texts: assignedArticles.length > 0
                      ? assignedArticles.map((article) => ({ id: article.id, text: article.text, metadata: { shortId: article.shortId } }))
                      : (activeQuestion.settings as unknown as TextAnnotationSettings).texts || [],
                  }}
                  brandColor={brandColor}
                  onComplete={handleAnnotationComplete}
                  sessionToken={session?.sessionToken}
                  formId={form.id}
                />
              </div>
            )}

            {isSubmitted && !isActiveThankYou && <FormCompleteDisplay brandColor={brandColor} />}

            {!isWelcome && !isActiveThankYou && !isSpecialScreen && !isSubmitted && (
              <div>
                <div className="mb-8">
                  <h2 className="text-2xl font-display font-bold text-obsidian mb-2">
                    {activeQuestion.title}
                    {activeQuestion.isRequired && <span className="text-red-500 ml-1">*</span>}
                  </h2>
                  {activeQuestion.description && <p className="text-obsidian-muted">{activeQuestion.description}</p>}
                </div>

                <QuestionInput
                  question={activeQuestion}
                  value={answers[activeQuestion.id]}
                  onChange={(val) => setAnswer(activeQuestion.id, val)}
                  brandColor={brandColor}
                  inputRef={inputRef}
                  onSubmit={goNext}
                />

                <div className="mt-8">
                  <Button
                    onClick={goNext}
                    disabled={!canProceedNow() || isSubmitting}
                    className="cursor-pointer transition-all hover:brightness-110 active:brightness-90"
                    style={{ backgroundColor: brandColor }}
                  >
                    {(() => {
                      const thankYouIdx = form.questions.findIndex((q) => q.type === "THANK_YOU_SCREEN");
                      const lastSubmittableIdx = thankYouIdx >= 0 ? thankYouIdx - 1 : form.questions.length - 1;
                      const isLastSubmittable = currentIndex === lastSubmittableIdx;

                      if (isSubmitting) return <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</>;
                      if (isLastSubmittable) return <>{form.submitText || "Submit"}<Check className="w-4 h-4 ml-2" /></>;
                      return <>OK<Check className="w-4 h-4 ml-2" /></>;
                    })()}
                  </Button>
                </div>
              </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default PublicFormPage;
