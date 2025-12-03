"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/atoms/Button";
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  InformedConsentDisplay,
  ConsentDeclinedDisplay,
} from "@/components/molecules/InformedConsentDisplay";
import { InformedConsentSettings } from "@/lib/informed-consent";
import { AnnotationDisplay } from "@/components/molecules/AnnotationDisplay";
import { TextAnnotationSettings, Annotation } from "@/lib/text-annotation";
import { DemographicsDisplay } from "@/components/molecules/DemographicsDisplay";
import { DemographicsSettings, DemographicAnswers, DEFAULT_DEMOGRAPHICS_SETTINGS } from "@/lib/demographics";

interface QuestionOption {
  id: string;
  label: string;
  value: string;
}

interface Question {
  id: string;
  type: string;
  title: string;
  description: string | null;
  placeholder: string | null;
  isRequired: boolean;
  settings: Record<string, unknown> | null;
  options: QuestionOption[];
}

interface FormData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  brandColor: string | null;
  buttonText: string | null;
  submitText: string | null;
  showProgressBar: boolean;
  // Quota settings
  articlesPerSession: number;
  quotaSettings: {
    groupByField: string;
    groups: Record<string, { values: string[]; target: number }>;
  } | null;
  sessionTimeoutMins: number;
  questions: Question[];
}

interface SessionData {
  id: string;
  sessionToken: string;
  demographicGroup: string | null;
  assignedArticleIds: string | null;
  articlesRequired: number;
  articlesCompleted: number;
  status: string;
}

interface AssignedArticle {
  id: string;
  shortId: string;
  text: string;
}

type AnswerValue = string | number | boolean | string[] | null;

// Sort questions in the correct logical order for the form flow
function sortQuestionsForFlow(questions: Question[]): Question[] {
  const welcomeScreen = questions.find((q) => q.type === "WELCOME_SCREEN");
  const informedConsent = questions.find((q) => q.type === "INFORMED_CONSENT");
  const demographics = questions.find((q) => q.type === "DEMOGRAPHICS");
  const thankYouScreen = questions.find((q) => q.type === "THANK_YOU_SCREEN");

  const regularQuestions = questions.filter(
    (q) =>
      q.type !== "WELCOME_SCREEN" &&
      q.type !== "INFORMED_CONSENT" &&
      q.type !== "DEMOGRAPHICS" &&
      q.type !== "THANK_YOU_SCREEN"
  );

  // Return in correct order: Welcome -> Consent -> Demographics -> Regular -> Thank You
  return [
    welcomeScreen,
    informedConsent,
    demographics,
    ...regularQuestions,
    thankYouScreen,
  ].filter((q): q is Question => q !== undefined);
}

export default function PublicFormPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [form, setForm] = useState<FormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [startedAt] = useState(new Date().toISOString());
  const [direction, setDirection] = useState(1);
  const [consentDeclined, setConsentDeclined] = useState(false);

  // Session management state
  const [session, setSession] = useState<SessionData | null>(null);
  const [assignedArticles, setAssignedArticles] = useState<AssignedArticle[]>([]);
  const [screenedOut, setScreenedOut] = useState(false);
  const [screenOutReason, setScreenOutReason] = useState<string | null>(null);
  const [returnUrl, setReturnUrl] = useState<string | null>(null);
  const [externalPid, setExternalPid] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Parse URL parameters for Dynata integration
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      // Support both psid (Dynata standard) and pid (legacy)
      const psid =
        urlParams.get("psid") ||
        urlParams.get("PSID") ||
        urlParams.get("pid") ||
        urlParams.get("PID");
      const ret =
        urlParams.get("return_url") ||
        urlParams.get("returnUrl") ||
        urlParams.get("return") ||
        urlParams.get("redirect");

      if (psid) setExternalPid(psid);
      if (ret) setReturnUrl(ret);

      // Check for stored session token
      const storedToken = localStorage.getItem(`session_${slug}`);
      if (storedToken) {
        // Will try to resume session after form loads
      }
    }
  }, [slug]);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const res = await fetch(`/api/forms/public/${slug}`);
        if (res.ok) {
          const data = await res.json();
          // Sort questions in correct logical order for form flow
          const sortedQuestions = sortQuestionsForFlow(data.questions);
          setForm({ ...data, questions: sortedQuestions });
        } else {
          const errorData = await res.json();
          setError(errorData.error || "Form not found");
        }
      } catch (err) {
        console.error("Failed to fetch form:", err);
        setError("Failed to load form");
      } finally {
        setIsLoading(false);
      }
    };

    fetchForm();
  }, [slug]);

  const currentQuestion = form?.questions[currentIndex];
  const isWelcome = currentQuestion?.type === "WELCOME_SCREEN";
  const isThankYou = currentQuestion?.type === "THANK_YOU_SCREEN";
  const isInformedConsent = currentQuestion?.type === "INFORMED_CONSENT";
  const isDemographics = currentQuestion?.type === "DEMOGRAPHICS";
  const isTextAnnotation = currentQuestion?.type === "TEXT_ANNOTATION";
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

  const canProceed = useCallback(() => {
    if (!currentQuestion) return false;
    if (isWelcome || isThankYou) return true;
    if (isInformedConsent) return false; // Consent uses separate buttons
    if (isDemographics) return false; // Demographics uses its own flow
    if (isTextAnnotation) return false; // Annotation has its own flow

    const answer = answers[currentQuestion.id];
    if (!currentQuestion.isRequired) return true;

    if (answer === undefined || answer === null || answer === "") return false;
    if (Array.isArray(answer) && answer.length === 0) return false;

    return true;
  }, [currentQuestion, answers, isWelcome, isThankYou, isInformedConsent, isDemographics, isTextAnnotation]);

  const handleConsentAgree = useCallback(() => {
    if (!currentQuestion) return;
    // Record consent in answers
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: true,
    }));
    // Move to next question
    setDirection(1);
    setCurrentIndex((prev) => prev + 1);
  }, [currentQuestion]);

  const handleConsentDecline = useCallback(() => {
    if (!currentQuestion) return;
    // Record decline (but don't store in submission)
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: false,
    }));
    // Show decline screen
    setConsentDeclined(true);
  }, [currentQuestion]);

  const handleAnnotationComplete = useCallback(async (annotations: Annotation[]) => {
    if (!currentQuestion || !form) return;

    // Store annotations as JSON string
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: JSON.stringify(annotations),
    };
    setAnswers(newAnswers);

    // Find thank you screen and determine if we need to submit
    const thankYouIndex = form.questions.findIndex(
      (q) => q.type === "THANK_YOU_SCREEN"
    );

    // Check if this is the last question before thank you, or the last question overall
    const isLastBeforeThankYou = thankYouIndex > 0 && currentIndex === thankYouIndex - 1;
    const isLastQuestion = currentIndex === form.questions.length - 1;
    const shouldSubmit = (isLastBeforeThankYou || isLastQuestion) && !isSubmitted;

    if (shouldSubmit) {
      // Submit the form
      setIsSubmitting(true);
      try {
        const res = await fetch(`/api/forms/public/${slug}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers: newAnswers,
            startedAt,
            sessionToken: session?.sessionToken,
          }),
        });

        if (res.ok) {
          setIsSubmitted(true);
          setDirection(1);
          // Navigate to thank you screen if it exists, otherwise stay on last question
          if (thankYouIndex >= 0) {
            setCurrentIndex(thankYouIndex);
          }
        } else {
          const errorData = await res.json();
          setError(errorData.error || "Failed to submit");
        }
      } catch (err) {
        console.error("Failed to submit:", err);
        setError("Failed to submit form");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Move to next question only if there are more questions
    if (currentIndex < form.questions.length - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentQuestion, form, currentIndex, answers, isSubmitted, slug, startedAt, session]);

  // Handle demographics completion - creates session and checks quotas
  const handleDemographicsComplete = useCallback(async (demographicAnswers: DemographicAnswers) => {
    if (!currentQuestion || !form) return;

    // Store demographics in answers
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: JSON.stringify(demographicAnswers),
    }));

    try {
      // Step 1: Create or resume session
      const sessionRes = await fetch(`/api/forms/${form.id}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          externalPid,
          returnUrl,
        }),
      });

      if (!sessionRes.ok) {
        const errorData = await sessionRes.json();
        setError(errorData.error || "Failed to create session");
        return;
      }

      const sessionData = await sessionRes.json();
      setSession(sessionData.session);

      // Store session token in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(`session_${slug}`, sessionData.session.sessionToken);
      }

      // Step 2: Request article assignment with demographics
      const assignRes = await fetch(`/api/forms/${form.id}/session/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken: sessionData.session.sessionToken,
          demographics: demographicAnswers,
        }),
      });

      const assignData = await assignRes.json();

      if (!assignRes.ok) {
        if (assignRes.status === 409) {
          // Quota full - screened out
          setScreenedOut(true);
          setScreenOutReason(assignData.reason || "quota_full");
          // Redirect if return URL provided
          if (returnUrl) {
            const redirectUrl = new URL(returnUrl);
            redirectUrl.searchParams.set("status", "quota_full");
            if (externalPid) redirectUrl.searchParams.set("pid", externalPid);
            window.location.href = redirectUrl.toString();
          }
          return;
        }
        setError(assignData.error || "Failed to assign articles");
        return;
      }

      // Store assigned articles
      setAssignedArticles(assignData.articles || []);
      setSession(assignData.session);

      // Move to next question
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to process demographics:", err);
      setError("Failed to process demographics");
    }
  }, [currentQuestion, form, externalPid, returnUrl, slug]);

  const goNext = useCallback(async () => {
    if (!form || !canProceed()) return;

    // Check if we're at the last question before thank you
    const thankYouIndex = form.questions.findIndex(
      (q) => q.type === "THANK_YOU_SCREEN"
    );
    const isLastQuestion = currentIndex === thankYouIndex - 1;

    if (isLastQuestion && !isSubmitted) {
      // Submit the form
      setIsSubmitting(true);
      try {
        const res = await fetch(`/api/forms/public/${slug}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers,
            startedAt,
            sessionToken: session?.sessionToken,
          }),
        });

        if (res.ok) {
          setIsSubmitted(true);
          setDirection(1);
          setCurrentIndex(thankYouIndex);
        } else {
          const errorData = await res.json();
          setError(errorData.error || "Failed to submit");
        }
      } catch (err) {
        console.error("Failed to submit:", err);
        setError("Failed to submit form");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (currentIndex < form.questions.length - 1) {
      setDirection(1);
      setCurrentIndex(currentIndex + 1);
    }
  }, [form, currentIndex, answers, startedAt, slug, canProceed, isSubmitted, session]);

  const goPrevious = useCallback(() => {
    if (currentIndex > 0 && !isThankYou) {
      setDirection(-1);
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex, isThankYou]);

  const setAnswer = useCallback(
    (value: AnswerValue) => {
      if (!currentQuestion) return;
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: value,
      }));
    },
    [currentQuestion]
  );

  // Focus input when question changes
  useEffect(() => {
    if (inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentQuestion || isLoading || consentDeclined) return;

      // Enter to proceed
      if (e.key === "Enter" && !e.shiftKey) {
        if (
          currentQuestion.type !== "LONG_TEXT" &&
          currentQuestion.type !== "INFORMED_CONSENT" &&
          currentQuestion.type !== "DEMOGRAPHICS" &&
          currentQuestion.type !== "TEXT_ANNOTATION" &&
          canProceed() &&
          !isSubmitting
        ) {
          e.preventDefault();
          goNext();
        }
      }

      // Escape or backspace (when input empty) to go back
      if (e.key === "Escape" && !isWelcome && !isInformedConsent && !isDemographics && !isTextAnnotation) {
        goPrevious();
      }

      // Y/N for informed consent
      if (currentQuestion.type === "INFORMED_CONSENT") {
        if (e.key.toLowerCase() === "y") {
          handleConsentAgree();
        } else if (e.key.toLowerCase() === "n") {
          handleConsentDecline();
        }
      }

      // Letter shortcuts for choice questions
      if (currentQuestion.type === "MULTIPLE_CHOICE" || currentQuestion.type === "DROPDOWN") {
        const letterIndex = e.key.toLowerCase().charCodeAt(0) - 97; // a=0, b=1, etc.
        if (letterIndex >= 0 && letterIndex < currentQuestion.options.length) {
          setAnswer(currentQuestion.options[letterIndex].value);
        }
      }

      // Checkboxes toggle with letters
      if (currentQuestion.type === "CHECKBOXES") {
        const letterIndex = e.key.toLowerCase().charCodeAt(0) - 97;
        if (letterIndex >= 0 && letterIndex < currentQuestion.options.length) {
          const optionValue = currentQuestion.options[letterIndex].value;
          const currentAnswer = (answers[currentQuestion.id] as string[]) || [];
          if (currentAnswer.includes(optionValue)) {
            setAnswer(currentAnswer.filter((v) => v !== optionValue));
          } else {
            setAnswer([...currentAnswer, optionValue]);
          }
        }
      }

      // Y/N for yes/no questions
      if (currentQuestion.type === "YES_NO") {
        if (e.key.toLowerCase() === "y") {
          setAnswer(true);
        } else if (e.key.toLowerCase() === "n") {
          setAnswer(false);
        }
      }

      // 1-5 for rating
      if (currentQuestion.type === "RATING") {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 5) {
          setAnswer(num);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    currentQuestion,
    isLoading,
    isSubmitting,
    isWelcome,
    isInformedConsent,
    isDemographics,
    isTextAnnotation,
    consentDeclined,
    answers,
    canProceed,
    goNext,
    goPrevious,
    setAnswer,
    handleConsentAgree,
    handleConsentDecline,
  ]);

  const brandColor = form?.brandColor || "#FF5A5F";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: brandColor }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-obsidian mb-2">{error}</h1>
          <p className="text-obsidian-muted">
            This form may not exist or is not available.
          </p>
        </div>
      </div>
    );
  }

  if (!form || !currentQuestion) {
    return null;
  }

  // Show consent declined screen
  if (consentDeclined) {
    const consentQuestion = form.questions.find((q) => q.type === "INFORMED_CONSENT");
    return (
      <div className="min-h-screen bg-canvas flex flex-col">
        <main className="flex-1 flex items-center justify-center px-6 py-16">
          <ConsentDeclinedDisplay
            settings={consentQuestion?.settings as InformedConsentSettings | null}
            brandColor={brandColor}
          />
        </main>
      </div>
    );
  }

  // Show screened out display (quota full)
  if (screenedOut) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col">
        <main className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="text-center max-w-md">
            <AlertCircle className="w-16 h-16 mx-auto mb-6 text-amber-500" />
            <h1 className="text-2xl font-display font-bold text-obsidian mb-4">
              {screenOutReason === "quota_full"
                ? "Thank you for your interest"
                : "Session could not be continued"}
            </h1>
            <p className="text-obsidian-muted">
              {screenOutReason === "quota_full"
                ? "Unfortunately, we have already collected enough responses from participants with your profile. Thank you for your willingness to participate."
                : "There was an issue with your session. Please contact the researcher if you believe this is an error."}
            </p>
            {returnUrl && (
              <p className="mt-4 text-sm text-gray-500">
                You will be redirected shortly...
              </p>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Progress Bar */}
      {form.showProgressBar && !isWelcome && !isThankYou && !isInformedConsent && !isDemographics && !isTextAnnotation && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50">
          <motion.div
            className="h-full"
            style={{ backgroundColor: brandColor }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Navigation - hidden for consent, demographics, annotation screens, and when submitted */}
      {!isWelcome && !isInformedConsent && !isDemographics && !isTextAnnotation && !isSubmitted && (
        <div className="fixed bottom-8 left-8 z-40 flex items-center gap-2">
          {currentIndex > 0 && !isThankYou && (
            <button
              onClick={goPrevious}
              className="p-3 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-obsidian" />
            </button>
          )}
          {!isThankYou && (
            <button
              onClick={goNext}
              disabled={!canProceed() || isSubmitting}
              className="p-3 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ChevronRight className="w-5 h-5 text-obsidian" />
              )}
            </button>
          )}
        </div>
      )}

      {/* Keyboard hint - not shown for consent, demographics, annotation, or when submitted */}
      {!isThankYou && !isInformedConsent && !isDemographics && !isTextAnnotation && !isSubmitted && (
        <div className="fixed bottom-8 right-8 z-40 text-sm text-obsidian-muted">
          press <kbd className="px-2 py-1 bg-white rounded shadow text-xs">Enter</kbd> to continue
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: direction * 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -50 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full max-w-2xl"
          >
            {/* Welcome Screen */}
            {isWelcome && (
              <div className="text-center">
                <h1 className="text-4xl font-display font-bold text-obsidian mb-4">
                  {currentQuestion.title}
                </h1>
                {currentQuestion.description && (
                  <p className="text-lg text-obsidian-muted mb-8">
                    {currentQuestion.description}
                  </p>
                )}
                <Button
                  onClick={goNext}
                  className="text-lg px-8 py-3"
                  style={{ backgroundColor: brandColor }}
                >
                  {form.buttonText || "Start"}
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}

            {/* Thank You Screen */}
            {isThankYou && (
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ backgroundColor: brandColor }}
                >
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl font-display font-bold text-obsidian mb-4">
                  {currentQuestion.title}
                </h1>
                {currentQuestion.description && (
                  <p className="text-lg text-obsidian-muted">
                    {currentQuestion.description}
                  </p>
                )}
              </div>
            )}

            {/* Informed Consent Screen */}
            {isInformedConsent && (
              <InformedConsentDisplay
                title={currentQuestion.title}
                description={currentQuestion.description}
                settings={currentQuestion.settings as InformedConsentSettings | null}
                brandColor={brandColor}
                onAgree={handleConsentAgree}
                onDecline={handleConsentDecline}
              />
            )}

            {/* Demographics Screen */}
            {isDemographics && (
              <DemographicsDisplay
                settings={(currentQuestion.settings as unknown as DemographicsSettings) || DEFAULT_DEMOGRAPHICS_SETTINGS}
                brandColor={brandColor}
                onComplete={handleDemographicsComplete}
              />
            )}

            {/* Text Annotation Screen */}
            {isTextAnnotation && currentQuestion.settings && !isSubmitted && (
              <div>
                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-display font-bold text-obsidian mb-2">
                    {currentQuestion.title}
                  </h2>
                  {currentQuestion.description && (
                    <p className="text-obsidian-muted">
                      {currentQuestion.description}
                    </p>
                  )}
                </div>
                <AnnotationDisplay
                  settings={{
                    ...(currentQuestion.settings as unknown as TextAnnotationSettings),
                    // Override texts with assigned articles from session
                    texts: assignedArticles.length > 0
                      ? assignedArticles.map((article) => ({
                          id: article.id,
                          text: article.text,
                          metadata: { shortId: article.shortId },
                        }))
                      : (currentQuestion.settings as unknown as TextAnnotationSettings).texts || [],
                  }}
                  brandColor={brandColor}
                  onComplete={handleAnnotationComplete}
                  sessionToken={session?.sessionToken}
                  formId={form.id}
                />
              </div>
            )}

            {/* Fallback Completion Screen (when no Thank You screen exists) */}
            {isSubmitted && !isThankYou && (
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ backgroundColor: brandColor }}
                >
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl font-display font-bold text-obsidian mb-4">
                  Thank you!
                </h1>
                <p className="text-lg text-obsidian-muted">
                  Your response has been submitted successfully.
                </p>
              </div>
            )}

            {/* Regular Questions */}
            {!isWelcome && !isThankYou && !isInformedConsent && !isDemographics && !isTextAnnotation && (
              <div>
                <div className="mb-8">
                  <h2 className="text-2xl font-display font-bold text-obsidian mb-2">
                    {currentQuestion.title}
                    {currentQuestion.isRequired && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </h2>
                  {currentQuestion.description && (
                    <p className="text-obsidian-muted">
                      {currentQuestion.description}
                    </p>
                  )}
                </div>

                <QuestionInput
                  question={currentQuestion}
                  value={answers[currentQuestion.id]}
                  onChange={setAnswer}
                  brandColor={brandColor}
                  inputRef={inputRef}
                  onSubmit={goNext}
                />

                <div className="mt-8">
                  <Button
                    onClick={goNext}
                    disabled={!canProceed() || isSubmitting}
                    style={{ backgroundColor: brandColor }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : currentIndex ===
                      form.questions.findIndex(
                        (q) => q.type === "THANK_YOU_SCREEN"
                      ) -
                        1 ? (
                      <>
                        {form.submitText || "Submit"}
                        <Check className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      <>
                        OK
                        <Check className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function QuestionInput({
  question,
  value,
  onChange,
  brandColor,
  inputRef,
  onSubmit,
}: {
  question: Question;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  brandColor: string;
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  onSubmit: () => void;
}) {
  switch (question.type) {
    case "SHORT_TEXT":
    case "EMAIL":
    case "NUMBER":
      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={question.type === "EMAIL" ? "email" : question.type === "NUMBER" ? "number" : "text"}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder || "Type your answer here..."}
          className="w-full text-xl border-0 border-b-2 border-gray-300 focus:border-current focus:ring-0 bg-transparent py-2 outline-none transition-colors"
          style={{ borderColor: value ? brandColor : undefined }}
        />
      );

    case "LONG_TEXT":
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder || "Type your answer here..."}
          className="w-full text-xl border-0 border-b-2 border-gray-300 focus:border-current focus:ring-0 bg-transparent py-2 outline-none transition-colors resize-none"
          style={{ borderColor: value ? brandColor : undefined }}
          rows={3}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.metaKey) {
              onSubmit();
            }
          }}
        />
      );

    case "MULTIPLE_CHOICE":
    case "DROPDOWN":
      return (
        <div className="space-y-3">
          {question.options.map((option, index) => (
            <button
              key={option.id}
              onClick={() => onChange(option.value)}
              className={`w-full p-4 text-left rounded-lg border-2 transition-all flex items-center gap-3 ${
                value === option.value
                  ? "border-current bg-opacity-10"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              style={{
                borderColor: value === option.value ? brandColor : undefined,
                backgroundColor:
                  value === option.value ? `${brandColor}15` : undefined,
              }}
            >
              <span
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium"
                style={{
                  borderColor: value === option.value ? brandColor : "#D1D5DB",
                  backgroundColor: value === option.value ? brandColor : undefined,
                  color: value === option.value ? "white" : "#6B7280",
                }}
              >
                {String.fromCharCode(65 + index)}
              </span>
              <span className="text-obsidian">{option.label}</span>
            </button>
          ))}
        </div>
      );

    case "CHECKBOXES":
      const checkboxValue = (value as string[]) || [];
      return (
        <div className="space-y-3">
          {question.options.map((option, index) => (
            <button
              key={option.id}
              onClick={() => {
                if (checkboxValue.includes(option.value)) {
                  onChange(checkboxValue.filter((v) => v !== option.value));
                } else {
                  onChange([...checkboxValue, option.value]);
                }
              }}
              className={`w-full p-4 text-left rounded-lg border-2 transition-all flex items-center gap-3 ${
                checkboxValue.includes(option.value)
                  ? "border-current bg-opacity-10"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              style={{
                borderColor: checkboxValue.includes(option.value)
                  ? brandColor
                  : undefined,
                backgroundColor: checkboxValue.includes(option.value)
                  ? `${brandColor}15`
                  : undefined,
              }}
            >
              <span
                className="w-6 h-6 rounded border-2 flex items-center justify-center text-xs font-medium"
                style={{
                  borderColor: checkboxValue.includes(option.value)
                    ? brandColor
                    : "#D1D5DB",
                  backgroundColor: checkboxValue.includes(option.value)
                    ? brandColor
                    : undefined,
                }}
              >
                {checkboxValue.includes(option.value) && (
                  <Check className="w-4 h-4 text-white" />
                )}
              </span>
              <span className="text-obsidian">{option.label}</span>
              <span className="ml-auto text-xs text-gray-400">
                {String.fromCharCode(65 + index)}
              </span>
            </button>
          ))}
        </div>
      );

    case "RATING":
      return (
        <div className="flex gap-3">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              onClick={() => onChange(num)}
              className={`w-14 h-14 rounded-lg border-2 text-xl font-medium transition-all ${
                value === num
                  ? "border-current"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              style={{
                borderColor: value === num ? brandColor : undefined,
                backgroundColor: value === num ? brandColor : undefined,
                color: value === num ? "white" : "#374151",
              }}
            >
              {num}
            </button>
          ))}
        </div>
      );

    case "YES_NO":
      return (
        <div className="flex gap-4">
          <button
            onClick={() => onChange(true)}
            className={`flex-1 p-4 rounded-lg border-2 text-lg font-medium transition-all flex items-center justify-center gap-2 ${
              value === true
                ? "border-current"
                : "border-gray-200 hover:border-gray-300"
            }`}
            style={{
              borderColor: value === true ? brandColor : undefined,
              backgroundColor: value === true ? brandColor : undefined,
              color: value === true ? "white" : "#374151",
            }}
          >
            <span
              className="w-6 h-6 rounded border-2 flex items-center justify-center text-xs"
              style={{
                borderColor: value === true ? "white" : "#D1D5DB",
              }}
            >
              Y
            </span>
            Yes
          </button>
          <button
            onClick={() => onChange(false)}
            className={`flex-1 p-4 rounded-lg border-2 text-lg font-medium transition-all flex items-center justify-center gap-2 ${
              value === false
                ? "border-current"
                : "border-gray-200 hover:border-gray-300"
            }`}
            style={{
              borderColor: value === false ? brandColor : undefined,
              backgroundColor: value === false ? brandColor : undefined,
              color: value === false ? "white" : "#374151",
            }}
          >
            <span
              className="w-6 h-6 rounded border-2 flex items-center justify-center text-xs"
              style={{
                borderColor: value === false ? "white" : "#D1D5DB",
              }}
            >
              N
            </span>
            No
          </button>
        </div>
      );

    case "DATE":
      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="date"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-xl border-0 border-b-2 border-gray-300 focus:border-current focus:ring-0 bg-transparent py-2 outline-none transition-colors"
          style={{ borderColor: value ? brandColor : undefined }}
        />
      );

    default:
      return null;
  }
}
