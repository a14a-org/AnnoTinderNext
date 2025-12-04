import type { Annotation, TextAnnotationSettings } from "@/features/annotation";
import type { Phase } from "../types";

import { useState } from "react";

export const useAnnotationState = (settings: TextAnnotationSettings) => {
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
  const [isSaving, setIsSaving] = useState(false);

  // Get the appropriate text list based on phase
  const currentTexts = phase === "practice" ? practiceTexts : texts;
  const currentText = currentTexts[currentIndex];
  const totalTexts = currentTexts.length;
  const progress = totalTexts > 0 ? ((currentIndex + 1) / totalTexts) * 100 : 0;

  // Helper to get the submit button text
  const getSubmitButtonText = (): string => {
    if (isSaving) return "Saving...";
    if (currentIndex < totalTexts - 1) return "Next Text";
    return "Complete";
  };

  const nextText = () => {
    if (currentIndex < totalTexts - 1) {
      setCurrentIndex(currentIndex + 1);
      return false; // Not done yet
    }
    return true; // Done with current phase
  };

  const resetForMainPhase = () => {
    setPhase("main");
    setCurrentIndex(0);
    setAnnotations([]);
  };

  const transitionToMain = () => {
    setPhase("transition");
  };

  return {
    phase,
    setPhase,
    currentIndex,
    annotations,
    setAnnotations,
    isSaving,
    setIsSaving,
    currentText,
    totalTexts,
    progress,
    practiceTexts,
    texts,
    getSubmitButtonText,
    nextText,
    resetForMainPhase,
    transitionToMain,
  };
};
