import type { Annotation, TextAnnotationSettings } from "@/features/annotation";
import type { Phase } from "../types";

import { useState, useMemo } from "react";

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

  // Track "nothing found" count for the session
  const [nothingFoundCount, setNothingFoundCount] = useState(0);

  // Get the appropriate text list based on phase
  const currentTexts = phase === "practice" ? practiceTexts : texts;
  const currentText = currentTexts[currentIndex];
  const totalTexts = currentTexts.length;
  const progress = totalTexts > 0 ? ((currentIndex + 1) / totalTexts) * 100 : 0;

  // Check if user can still use "nothing found" (based on limit)
  const maxNothingFound = settings.maxNothingFoundPerSession ?? 2;
  const canUseNothingFound = useMemo(() => {
    if (maxNothingFound === 0) return true; // 0 = unlimited
    return nothingFoundCount < maxNothingFound;
  }, [nothingFoundCount, maxNothingFound]);

  // Helper to get the submit button text
  const getSubmitButtonText = (): string => {
    if (isSaving) return "Opslaan...";
    if (currentIndex < totalTexts - 1) return "Volgende";
    return "Voltooien";
  };

  const nextText = () => {
    if (currentIndex < totalTexts - 1) {
      setCurrentIndex(currentIndex + 1);
      return false; // Not done yet
    }
    return true; // Done with current phase
  };

  const incrementNothingFoundCount = () => {
    setNothingFoundCount((prev) => prev + 1);
  };

  const resetForMainPhase = () => {
    setPhase("main");
    setCurrentIndex(0);
    setAnnotations([]);
    // Don't reset nothingFoundCount - it persists across phases
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
    // Nothing found tracking
    nothingFoundCount,
    canUseNothingFound,
    incrementNothingFoundCount,
    maxNothingFoundPerSession: maxNothingFound,
  };
};
