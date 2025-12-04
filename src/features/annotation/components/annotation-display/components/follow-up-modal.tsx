import type { FollowUpQuestion, TextAnnotationSettings } from "@/features/annotation";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface FollowUpModalProps {
  showFollowUp: boolean;
  selectedText: string | null;
  highlightColor: string;
  brandColor: string;
  settings: TextAnnotationSettings;
  followUpAnswers: Record<string, string | number | null>;
  isSaving: boolean;
  onClearSelection: () => void;
  onFollowUpSubmit: () => void;
  setFollowUpAnswers: (answers: Record<string, string | number | null> | ((prev: Record<string, string | number | null>) => Record<string, string | number | null>)) => void;
  getSubmitButtonText: () => string;
}

export const FollowUpModal = ({
  showFollowUp,
  selectedText,
  highlightColor,
  brandColor,
  settings,
  followUpAnswers,
  isSaving,
  onClearSelection,
  onFollowUpSubmit,
  setFollowUpAnswers,
  getSubmitButtonText,
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

  return (
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
              style={{ backgroundColor: highlightColor }}
            >
              &ldquo;{selectedText}&rdquo;
            </p>
            <button
              onClick={onClearSelection}
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
            onClick={onFollowUpSubmit}
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
            {getSubmitButtonText()}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
