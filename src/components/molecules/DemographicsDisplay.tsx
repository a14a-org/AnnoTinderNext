"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DemographicsSettings,
  DemographicAnswers,
  validateDemographics,
} from "@/lib/demographics";

interface DemographicsDisplayProps {
  settings: DemographicsSettings;
  brandColor?: string;
  onComplete: (answers: DemographicAnswers) => void;
}

export function DemographicsDisplay({
  settings,
  brandColor = "#EF4444",
  onComplete,
}: DemographicsDisplayProps) {
  const [answers, setAnswers] = useState<DemographicAnswers>({});
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);

  const currentField = settings.fields[currentFieldIndex];
  const totalFields = settings.fields.length;
  const progress = ((currentFieldIndex + 1) / totalFields) * 100;

  const handleSelect = useCallback(
    (value: string) => {
      const newAnswers = {
        ...answers,
        [currentField.id]: value,
      };
      setAnswers(newAnswers);

      // Auto-advance after selection
      setTimeout(() => {
        if (currentFieldIndex < totalFields - 1) {
          setCurrentFieldIndex(currentFieldIndex + 1);
        } else {
          // All fields complete
          const validation = validateDemographics(newAnswers, settings);
          if (validation.valid) {
            onComplete(newAnswers);
          }
        }
      }, 300);
    },
    [answers, currentField, currentFieldIndex, totalFields, settings, onComplete]
  );

  const handleBack = useCallback(() => {
    if (currentFieldIndex > 0) {
      setCurrentFieldIndex(currentFieldIndex - 1);
    }
  }, [currentFieldIndex]);

  const currentAnswer = answers[currentField?.id];
  const isLastField = currentFieldIndex === totalFields - 1;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if user is typing in a text input
      if (e.target instanceof HTMLInputElement) {
        // For text fields, only handle Enter to proceed
        if (e.key === "Enter" && currentAnswer && !e.shiftKey) {
          e.preventDefault();
          if (isLastField) {
            const validation = validateDemographics(answers, settings);
            if (validation.valid) {
              onComplete(answers);
            }
          } else {
            setCurrentFieldIndex(currentFieldIndex + 1);
          }
        }
        return;
      }

      // A-Z for single choice selection
      if (
        currentField?.type === "single_choice" &&
        currentField.options &&
        e.key.length === 1 &&
        /^[a-z]$/i.test(e.key)
      ) {
        const letterIndex = e.key.toLowerCase().charCodeAt(0) - 97; // a=0, b=1, etc.
        if (letterIndex >= 0 && letterIndex < currentField.options.length) {
          e.preventDefault();
          handleSelect(currentField.options[letterIndex]);
        }
      }

      // Escape to go back
      if (e.key === "Escape" && currentFieldIndex > 0) {
        e.preventDefault();
        handleBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    currentField,
    currentFieldIndex,
    currentAnswer,
    isLastField,
    answers,
    settings,
    handleSelect,
    handleBack,
    onComplete,
  ]);

  if (!currentField) {
    return null;
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>
            Question {currentFieldIndex + 1} of {totalFields}
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

      {/* Title and description (show only on first field) */}
      {currentFieldIndex === 0 && (
        <div className="text-center mb-8">
          <h2 className="text-2xl font-display font-bold text-obsidian mb-2">
            {settings.title}
          </h2>
          {settings.description && (
            <p className="text-obsidian-muted">{settings.description}</p>
          )}
        </div>
      )}

      {/* Current field */}
      <motion.div
        key={currentField.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="text-xl font-medium text-obsidian mb-6 text-center">
          {currentField.label}
          {currentField.required && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </h3>

        {currentField.type === "single_choice" && currentField.options && (
          <div className="space-y-3">
            {currentField.options.map((option, index) => (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all flex items-center gap-3 ${
                  currentAnswer === option
                    ? "border-current bg-opacity-10"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                style={{
                  borderColor: currentAnswer === option ? brandColor : undefined,
                  backgroundColor:
                    currentAnswer === option ? `${brandColor}15` : undefined,
                }}
              >
                <span
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium"
                  style={{
                    borderColor:
                      currentAnswer === option ? brandColor : "#D1D5DB",
                    backgroundColor:
                      currentAnswer === option ? brandColor : undefined,
                    color: currentAnswer === option ? "white" : "#6B7280",
                  }}
                >
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="text-obsidian">{option}</span>
              </button>
            ))}
          </div>
        )}

        {currentField.type === "text" && (
          <input
            type="text"
            value={currentAnswer || ""}
            onChange={(e) =>
              setAnswers((prev) => ({
                ...prev,
                [currentField.id]: e.target.value,
              }))
            }
            placeholder={currentField.placeholder || "Type your answer..."}
            className="w-full text-xl border-0 border-b-2 border-gray-300 focus:border-current focus:ring-0 bg-transparent py-2 outline-none transition-colors"
            style={{ borderColor: currentAnswer ? brandColor : undefined }}
            autoFocus
          />
        )}
      </motion.div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={handleBack}
          disabled={currentFieldIndex === 0}
          className={`text-sm ${
            currentFieldIndex === 0
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          ← Back
        </button>

        {currentField.type === "text" && currentAnswer && (
          <button
            onClick={() => {
              if (isLastField) {
                const validation = validateDemographics(answers, settings);
                if (validation.valid) {
                  onComplete(answers);
                }
              } else {
                setCurrentFieldIndex(currentFieldIndex + 1);
              }
            }}
            className="px-6 py-2 rounded-lg font-medium text-white transition-colors"
            style={{ backgroundColor: brandColor }}
          >
            {isLastField ? "Continue" : "Next"}
          </button>
        )}
      </div>

      {/* Keyboard hint */}
      {currentField.type === "single_choice" && currentField.options && (
        <div className="text-center mt-8 text-sm text-gray-400">
          Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">A</kbd>-
          <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
            {String.fromCharCode(64 + currentField.options.length)}
          </kbd>{" "}
          to select
          {currentFieldIndex > 0 && (
            <>
              {" · "}
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Esc</kbd> to go back
            </>
          )}
        </div>
      )}
      {currentField.type === "text" && currentAnswer && (
        <div className="text-center mt-8 text-sm text-gray-400">
          Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Enter</kbd> to continue
          {currentFieldIndex > 0 && (
            <>
              {" · "}
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Esc</kbd> to go back
            </>
          )}
        </div>
      )}
    </div>
  );
}
