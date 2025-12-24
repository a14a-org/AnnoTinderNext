import type { FollowUpQuestion, TextAnnotationSettings, SelectionRange, MultiSelectMode } from "@/features/annotation";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface FollowUpModalProps {
  showFollowUp: boolean;
  highlightColor: string;
  brandColor: string;
  settings: TextAnnotationSettings;
  followUpAnswers: Record<string, string | number | null>;
  isSaving: boolean;
  isTimeCompleted?: boolean;
  onClearSelection: () => void;
  onFollowUpSubmit: () => void;
  setFollowUpAnswers: (answers: Record<string, string | number | null> | ((prev: Record<string, string | number | null>) => Record<string, string | number | null>)) => void;
  getSubmitButtonText: () => string;
  /** Multi-select mode */
  multiSelectMode: MultiSelectMode;
  /** Current selection being answered (per-selection mode) */
  currentSelection: SelectionRange | null;
  /** All pending selections (batch mode) */
  pendingSelections: SelectionRange[];
  /** @deprecated Use currentSelection or pendingSelections instead */
  selectedText?: string | null;
}

export const FollowUpModal = ({
  showFollowUp,
  highlightColor,
  brandColor,
  settings,
  followUpAnswers,
  isSaving,
  isTimeCompleted = true,
  onClearSelection,
  onFollowUpSubmit,
  setFollowUpAnswers,
  getSubmitButtonText,
  multiSelectMode,
  currentSelection,
  pendingSelections,
}: FollowUpModalProps) => {
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
        minRating: settings.followUp.minRating,
        maxRating: settings.followUp.maxRating,
        minLabel: settings.followUp.minLabel,
        maxLabel: settings.followUp.maxLabel,
        minWords: undefined,
      }];
    }
    return [];
  }, [settings.followUpQuestions, settings.followUp]);

  // Helper to count words in a string
  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
  };

  // Check validation for each question
  const questionValidation = useMemo(() => {
    return followUpQuestions.map((q) => {
      const answer = followUpAnswers[q.id];
      const hasAnswer = answer !== null && answer !== undefined && answer !== "";

      // Check minWords for open_text
      if (q.type === "open_text" && q.minWords && q.minWords > 0 && typeof answer === "string") {
        const wordCount = countWords(answer);
        const meetsMinWords = wordCount >= q.minWords;
        return {
          id: q.id,
          isValid: !q.isRequired || (hasAnswer && meetsMinWords),
          wordCount,
          minWords: q.minWords,
          needsMoreWords: hasAnswer && !meetsMinWords,
        };
      }

      return {
        id: q.id,
        isValid: !q.isRequired || hasAnswer,
        wordCount: 0,
        minWords: 0,
        needsMoreWords: false,
      };
    });
  }, [followUpQuestions, followUpAnswers]);

  // Check if all required questions are answered (and meet minWords)
  const canSubmit = useMemo(() => {
    return questionValidation.every((v) => v.isValid);
  }, [questionValidation]);

  // Get selected texts to display based on mode
  const selectedTexts = useMemo(() => {
    if (multiSelectMode === "per-selection" && currentSelection) {
      return [currentSelection.text];
    }
    if (multiSelectMode === "batch" && pendingSelections.length > 0) {
      return pendingSelections.map((s) => s.text);
    }
    return [];
  }, [multiSelectMode, currentSelection, pendingSelections]);

  // Determine if we should show the modal
  const shouldShow = showFollowUp && selectedTexts.length > 0;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="bg-gray-50 rounded-xl p-6 mb-6"
        >
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">
              {selectedTexts.length === 1 ? "Geselecteerd:" : `Geselecteerd (${selectedTexts.length}):`}
            </p>

            {/* Show single or multiple selected texts */}
            <div className="space-y-2">
              {selectedTexts.map((text, index) => (
                <p
                  key={index}
                  className="text-sm font-medium px-2 py-1 rounded inline-block mr-2"
                  style={{ backgroundColor: highlightColor }}
                >
                  &ldquo;{text}&rdquo;
                </p>
              ))}
            </div>

            {/* Only show clear button in per-selection mode */}
            {multiSelectMode === "per-selection" && (
              <button
                onClick={onClearSelection}
                className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Annuleren
              </button>
            )}
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
                {question.type === "open_text" && (() => {
                  const validation = questionValidation.find((v) => v.id === question.id);
                  const currentWordCount = validation?.wordCount ?? 0;
                  const minWords = question.minWords ?? 0;
                  const needsMoreWords = validation?.needsMoreWords ?? false;

                  return (
                    <div>
                      <textarea
                        value={(followUpAnswers[question.id] as string) || ""}
                        onChange={(e) =>
                          setFollowUpAnswers((prev) => ({
                            ...prev,
                            [question.id]: e.target.value,
                          }))
                        }
                        placeholder={question.placeholder || "Typ je antwoord..."}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                          needsMoreWords ? "border-amber-400" : "border-gray-200"
                        }`}
                        style={
                          { "--tw-ring-color": brandColor } as React.CSSProperties
                        }
                        rows={3}
                      />
                      {minWords > 0 && (
                        <div className={`mt-1 text-xs ${
                          needsMoreWords ? "text-amber-600" : "text-gray-400"
                        }`}>
                          {currentWordCount}/{minWords} woorden
                          {needsMoreWords && ` (nog ${minWords - currentWordCount} nodig)`}
                        </div>
                      )}
                    </div>
                  );
                })()}

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
            onClick={onFollowUpSubmit}
            disabled={!canSubmit || isSaving || !isTimeCompleted}
            className={`mt-6 w-full py-3 rounded-lg font-medium text-white transition-all ${
              !canSubmit || isSaving || !isTimeCompleted
                ? "bg-gray-300 cursor-not-allowed"
                : "cursor-pointer hover:brightness-110 active:brightness-90"
            }`}
            style={{
              backgroundColor:
                canSubmit && !isSaving && isTimeCompleted ? brandColor : undefined,
            }}
          >
            {getSubmitButtonText()}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
