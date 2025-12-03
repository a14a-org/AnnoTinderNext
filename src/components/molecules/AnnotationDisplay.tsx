"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import {
  TextAnnotationSettings,
  Annotation,
  FollowUpQuestion,
  splitIntoSentences,
  splitIntoWords,
} from "@/lib/text-annotation";

interface AnnotationDisplayProps {
  settings: TextAnnotationSettings;
  brandColor?: string;
  onComplete: (annotations: Annotation[]) => void;
  /** Session token for saving annotations to the API */
  sessionToken?: string;
  /** Form ID for API calls */
  formId?: string;
}

type Phase = "practice" | "transition" | "main";

export function AnnotationDisplay({
  settings,
  brandColor = "#EF4444",
  onComplete,
  sessionToken,
  formId,
}: AnnotationDisplayProps) {
  // Ensure practiceTexts is always an array (may be undefined in older settings)
  const practiceTexts = settings.practiceTexts || [];
  const texts = settings.texts || [];

  // Determine if we need practice phase
  const hasPracticePhase =
    settings.textSource === "database" &&
    settings.showPracticeFirst &&
    practiceTexts.length > 0;

  const [phase, setPhase] = useState<Phase>(hasPracticePhase ? "practice" : "main");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<{
    start: number;
    end: number;
  } | null>(null);
  // Track answers for multiple follow-up questions
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string | number | null>>({});
  const [showFollowUp, setShowFollowUp] = useState(false);

  // Get follow-up questions (with fallback from old single followUp format)
  const followUpQuestions: FollowUpQuestion[] = useMemo(() => {
    if (settings.followUpQuestions && settings.followUpQuestions.length > 0) {
      return settings.followUpQuestions;
    }
    // Migrate from old single followUp if present
    if (settings.followUp) {
      return [{
        id: "migrated-q1",
        type: settings.followUp.type,
        question: settings.followUp.question,
        isRequired: true,
        options: settings.followUp.options,
        placeholder: settings.followUp.placeholder,
        minLabel: settings.followUp.minLabel,
        maxLabel: settings.followUp.maxLabel,
      }];
    }
    return [];
  }, [settings.followUpQuestions, settings.followUp]);

  // Check if all required questions are answered
  const canSubmit = useMemo(() => {
    return followUpQuestions.every((q) => {
      if (!q.isRequired) return true;
      const answer = followUpAnswers[q.id];
      return answer !== null && answer !== undefined && answer !== "";
    });
  }, [followUpQuestions, followUpAnswers]);
  const [isSaving, setIsSaving] = useState(false);

  // Get the appropriate text list based on phase
  const currentTexts = phase === "practice" ? practiceTexts : texts;
  const currentText = currentTexts[currentIndex];
  const totalTexts = currentTexts.length;
  const progress = totalTexts > 0 ? ((currentIndex + 1) / totalTexts) * 100 : 0;

  // Handle transition to main phase
  const handleStartMain = useCallback(() => {
    setPhase("main");
    setCurrentIndex(0);
    setAnnotations([]);
  }, []);

  // Split text based on selection mode
  const segments = useMemo(() => {
    if (!currentText) return [];
    return settings.selectionMode === "sentence"
      ? splitIntoSentences(currentText.text)
      : splitIntoWords(currentText.text);
  }, [currentText, settings.selectionMode]);

  // Save annotation to API
  const saveAnnotationToApi = useCallback(
    async (annotation: Annotation, articleId: string) => {
      if (!sessionToken || !formId) return;

      try {
        await fetch(`/api/forms/${formId}/session/annotate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionToken,
            articleId,
            selectedText: annotation.selectedText,
            startIndex: annotation.startIndex,
            endIndex: annotation.endIndex,
            // Send follow-up answers as JSON string
            followUpAnswers: JSON.stringify(annotation.followUpAnswers),
            skipped: annotation.skipped,
          }),
        });
      } catch (error) {
        console.error("Failed to save annotation:", error);
      }
    },
    [sessionToken, formId]
  );

  // Complete session via API
  const completeSession = useCallback(async () => {
    if (!sessionToken || !formId) return;

    try {
      await fetch(`/api/forms/${formId}/session/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken }),
      });
    } catch (error) {
      console.error("Failed to complete session:", error);
    }
  }, [sessionToken, formId]);

  const handleSegmentClick = useCallback(
    (segment: string, index: number) => {
      // Calculate start/end indices in original text
      let startIndex = 0;
      for (let i = 0; i < index; i++) {
        startIndex = currentText.text.indexOf(segments[i], startIndex) + segments[i].length;
      }
      const actualStart = currentText.text.indexOf(segment, startIndex > 0 ? startIndex - segment.length : 0);
      const actualEnd = actualStart + segment.length;

      setSelectedText(segment);
      setSelectedIndices({ start: actualStart, end: actualEnd });
      setShowFollowUp(true);
      setFollowUpAnswers({});
    },
    [currentText, segments]
  );

  const resetSelection = useCallback(() => {
    setSelectedText(null);
    setSelectedIndices(null);
    setShowFollowUp(false);
    setFollowUpAnswers({});
  }, []);

  const handleFollowUpSubmit = useCallback(async () => {
    if (!selectedText || !selectedIndices || !currentText) return;

    setIsSaving(true);

    const annotation: Annotation = {
      textId: currentText.id,
      selectedText,
      startIndex: selectedIndices.start,
      endIndex: selectedIndices.end,
      followUpAnswers,
      skipped: false,
    };

    // Only save to API during main phase (not practice)
    if (phase === "main") {
      await saveAnnotationToApi(annotation, currentText.id);
    }

    const newAnnotations = [...annotations, annotation];
    setAnnotations(newAnnotations);

    // Move to next text or complete/transition
    if (currentIndex < totalTexts - 1) {
      setCurrentIndex(currentIndex + 1);
      resetSelection();
    } else {
      if (phase === "practice") {
        // Show transition screen before main phase
        setPhase("transition");
        resetSelection();
      } else {
        // Complete the session
        await completeSession();
        onComplete(newAnnotations);
      }
    }

    setIsSaving(false);
  }, [
    selectedText,
    selectedIndices,
    currentText,
    followUpAnswers,
    annotations,
    currentIndex,
    totalTexts,
    phase,
    onComplete,
    resetSelection,
    saveAnnotationToApi,
    completeSession,
  ]);

  const handleSkip = useCallback(async () => {
    if (!currentText) return;

    setIsSaving(true);

    const annotation: Annotation = {
      textId: currentText.id,
      selectedText: "",
      startIndex: 0,
      endIndex: 0,
      followUpAnswers: {},
      skipped: true,
    };

    // Only save to API during main phase (not practice)
    if (phase === "main") {
      await saveAnnotationToApi(annotation, currentText.id);
    }

    const newAnnotations = [...annotations, annotation];
    setAnnotations(newAnnotations);

    if (currentIndex < totalTexts - 1) {
      setCurrentIndex(currentIndex + 1);
      resetSelection();
    } else {
      if (phase === "practice") {
        // Show transition screen before main phase
        setPhase("transition");
        resetSelection();
      } else {
        // Complete the session
        await completeSession();
        onComplete(newAnnotations);
      }
    }

    setIsSaving(false);
  }, [currentText, annotations, currentIndex, totalTexts, phase, onComplete, resetSelection, saveAnnotationToApi, completeSession]);

  const handleClearSelection = useCallback(() => {
    resetSelection();
  }, [resetSelection]);

  // Show transition screen between practice and main phase
  if (phase === "transition") {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: brandColor }}
          >
            <Check className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-display font-bold text-obsidian mb-4">
            Practice Complete!
          </h2>
          <p className="text-obsidian-muted mb-8 max-w-md mx-auto">
            Great job! You&apos;ve completed the practice round. Now you&apos;ll start annotating the actual texts.
            There are {texts.length} texts to annotate.
          </p>
          <button
            onClick={handleStartMain}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all hover:opacity-90"
            style={{ backgroundColor: brandColor }}
          >
            Start Main Task
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    );
  }

  if (!currentText) {
    return (
      <div className="text-center text-gray-500 py-8">
        No texts to annotate
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Phase indicator for practice */}
      {phase === "practice" && (
        <div className="mb-4 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-center">
          <span className="text-xs font-medium text-amber-800">
            Practice Round - {currentIndex + 1} of {totalTexts}
          </span>
        </div>
      )}

      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>
            {phase === "practice" ? "Practice" : "Text"} {currentIndex + 1} of {totalTexts}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: brandColor }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Instruction */}
      <p className="text-sm text-gray-600 mb-4 text-center">
        {settings.instructionText}
      </p>

      {/* Text display with selectable segments */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6"
        >
          <div className="text-lg leading-relaxed">
            {settings.selectionMode === "sentence" ? (
              // Sentence mode: render sentences as clickable blocks
              <div className="space-y-2">
                {segments.map((segment, index) => (
                  <span
                    key={index}
                    onClick={() => handleSegmentClick(segment, index)}
                    className={`inline cursor-pointer transition-all duration-200 rounded px-1 -mx-1 ${
                      selectedText === segment
                        ? "ring-2 ring-offset-1"
                        : "hover:bg-gray-100"
                    }`}
                    style={{
                      backgroundColor:
                        selectedText === segment
                          ? settings.highlightColor
                          : undefined,
                      borderColor:
                        selectedText === segment ? brandColor : undefined,
                    }}
                  >
                    {segment}{" "}
                  </span>
                ))}
              </div>
            ) : (
              // Word mode: render words as clickable spans
              <div className="flex flex-wrap gap-1">
                {segments.map((segment, index) => (
                  <span
                    key={index}
                    onClick={() => handleSegmentClick(segment, index)}
                    className={`cursor-pointer transition-all duration-200 rounded px-1 ${
                      selectedText === segment
                        ? "ring-2 ring-offset-1"
                        : "hover:bg-gray-100"
                    }`}
                    style={{
                      backgroundColor:
                        selectedText === segment
                          ? settings.highlightColor
                          : undefined,
                      borderColor:
                        selectedText === segment ? brandColor : undefined,
                    }}
                  >
                    {segment}
                  </span>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Follow-up questions panel */}
      <AnimatePresence>
        {showFollowUp && selectedText && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-gray-50 rounded-xl p-6 mb-6"
          >
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">Selected:</p>
              <p
                className="text-sm font-medium px-2 py-1 rounded inline-block"
                style={{ backgroundColor: settings.highlightColor }}
              >
                &ldquo;{selectedText}&rdquo;
              </p>
              <button
                onClick={handleClearSelection}
                className="ml-2 text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Clear selection
              </button>
            </div>

            {/* Render all follow-up questions */}
            <div className="space-y-6">
              {followUpQuestions.map((question, qIndex) => (
                <div key={question.id} className="space-y-3">
                  <p className="font-medium text-obsidian">
                    {question.question}
                    {question.isRequired && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </p>

                  {/* Multiple Choice */}
                  {question.type === "multiple_choice" && (
                    <div className="space-y-2">
                      {question.options?.map((option, index) => (
                        <button
                          key={index}
                          onClick={() =>
                            setFollowUpAnswers((prev) => ({
                              ...prev,
                              [question.id]: option.value,
                            }))
                          }
                          className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                            followUpAnswers[question.id] === option.value
                              ? "border-2 bg-white"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                          }`}
                          style={{
                            borderColor:
                              followUpAnswers[question.id] === option.value
                                ? brandColor
                                : undefined,
                          }}
                        >
                          <span className="text-sm font-medium mr-2 text-gray-400">
                            {String.fromCharCode(65 + index)}
                          </span>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Open Text */}
                  {question.type === "open_text" && (
                    <textarea
                      value={(followUpAnswers[question.id] as string) || ""}
                      onChange={(e) =>
                        setFollowUpAnswers((prev) => ({
                          ...prev,
                          [question.id]: e.target.value,
                        }))
                      }
                      placeholder={question.placeholder || "Type your answer..."}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1"
                      style={
                        { "--tw-ring-color": brandColor } as React.CSSProperties
                      }
                      rows={3}
                    />
                  )}

                  {/* Rating Scale */}
                  {question.type === "rating_scale" && (
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-2">
                        <span>{question.minLabel || "1"}</span>
                        <span>{question.maxLabel || "5"}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() =>
                              setFollowUpAnswers((prev) => ({
                                ...prev,
                                [question.id]: rating,
                              }))
                            }
                            className={`flex-1 py-3 rounded-lg border-2 font-medium transition-all ${
                              followUpAnswers[question.id] === rating
                                ? "text-white"
                                : "border-gray-200 hover:border-gray-300 bg-white"
                            }`}
                            style={{
                              backgroundColor:
                                followUpAnswers[question.id] === rating
                                  ? brandColor
                                  : undefined,
                              borderColor:
                                followUpAnswers[question.id] === rating
                                  ? brandColor
                                  : undefined,
                            }}
                          >
                            {rating}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Separator between questions */}
                  {qIndex < followUpQuestions.length - 1 && (
                    <div className="border-b border-gray-200 pt-3" />
                  )}
                </div>
              ))}
            </div>

            {/* Submit button */}
            <button
              onClick={handleFollowUpSubmit}
              disabled={!canSubmit || isSaving}
              className={`mt-6 w-full py-3 rounded-lg font-medium text-white transition-all ${
                !canSubmit || isSaving
                  ? "bg-gray-300 cursor-not-allowed"
                  : "hover:opacity-90"
              }`}
              style={{
                backgroundColor:
                  canSubmit && !isSaving ? brandColor : undefined,
              }}
            >
              {isSaving ? "Saving..." : currentIndex < totalTexts - 1 ? "Next Text" : "Complete"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip button */}
      {settings.allowSkip && !showFollowUp && (
        <div className="text-center">
          <button
            onClick={handleSkip}
            disabled={isSaving}
            className="text-sm text-gray-500 hover:text-gray-700 underline disabled:opacity-50"
          >
            {isSaving ? "Saving..." : settings.skipButtonText || "Skip this text"}
          </button>
        </div>
      )}
    </div>
  );
}
