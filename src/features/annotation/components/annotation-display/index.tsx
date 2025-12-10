"use client";

import type { Annotation } from "@/features/annotation";
import type { AnnotationDisplayProps } from "./types";

import { useCallback, useMemo } from "react";

import { useAnnotationState, useSegmentSelection, useAnnotationApi, useMinimumTime } from "./hooks";
import { PracticePhase, TransitionPhase, AnnotationPhase } from "./components";
import { splitIntoSegments } from "./utils/segment-utils";

export const AnnotationDisplay = ({
  settings,
  brandColor = "#EF4444",
  onComplete,
  sessionToken,
  formId,
}: AnnotationDisplayProps) => {
  // State management
  const {
    phase,
    currentIndex,
    annotations,
    setAnnotations,
    isSaving,
    setIsSaving,
    currentText,
    totalTexts,
    progress,
    texts,
    getSubmitButtonText,
    nextText,
    resetForMainPhase,
    transitionToMain,
  } = useAnnotationState(settings);

  // Timer for minimum time on page (TODO: Make configurable in settings)
  const { isCompleted: isTimeCompleted, timeLeft, resetTimer } = useMinimumTime(5);

  // Split text based on selection mode
  const segments = useMemo(() => {
    return splitIntoSegments(currentText, settings.selectionMode);
  }, [currentText, settings.selectionMode]);

  // Segment selection
  const {
    selectedText,
    selectedIndices,
    followUpAnswers,
    setFollowUpAnswers,
    showFollowUp,
    handleSegmentClick,
    resetSelection,
  } = useSegmentSelection(currentText, segments);

  // API hooks
  const { saveAnnotationToApi, completeSession } = useAnnotationApi(
    sessionToken,
    formId
  );

  // Handle transition to main phase
  const handleStartMain = useCallback(() => {
    resetForMainPhase();
    resetTimer(); // Reset timer for first main text
  }, [resetForMainPhase, resetTimer]);

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
    const isDone = nextText();
    resetTimer(); // Reset timer for next text
    
    if (isDone) {
      if (phase === "practice") {
        // Show transition screen before main phase
        transitionToMain();
        resetSelection();
      } else {
        // Complete the session
        await completeSession();
        onComplete(newAnnotations);
      }
    } else {
      resetSelection();
    }

    setIsSaving(false);
  }, [
    selectedText,
    selectedIndices,
    currentText,
    followUpAnswers,
    annotations,
    phase,
    onComplete,
    resetSelection,
    saveAnnotationToApi,
    completeSession,
    setIsSaving,
    setAnnotations,
    nextText,
    transitionToMain,
    resetTimer,
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

    const isDone = nextText();
    resetTimer(); // Reset timer for next text

    if (isDone) {
      if (phase === "practice") {
        // Show transition screen before main phase
        transitionToMain();
        resetSelection();
      } else {
        // Complete the session
        await completeSession();
        onComplete(newAnnotations);
      }
    } else {
      resetSelection();
    }

    setIsSaving(false);
  }, [
    currentText,
    annotations,
    phase,
    onComplete,
    resetSelection,
    saveAnnotationToApi,
    completeSession,
    setIsSaving,
    setAnnotations,
    nextText,
    transitionToMain,
    resetTimer,
  ]);

  const handleClearSelection = useCallback(() => {
    resetSelection();
  }, [resetSelection]);

  // Show transition screen between practice and main phase
  if (phase === "transition") {
    return (
      <TransitionPhase
        brandColor={brandColor}
        textsCount={texts.length}
        onStartMain={handleStartMain}
      />
    );
  }

  if (!currentText) {
    return (
      <div className="text-center text-gray-500 py-8">
        No texts to annotate
      </div>
    );
  }

  // Render practice or main annotation phase
  const commonProps = {
    currentIndex,
    totalTexts,
    progress,
    brandColor,
    settings,
    segments,
    selectedText,
    showFollowUp,
    followUpAnswers,
    isSaving,
    isTimeCompleted,
    timeLeft,
    onSegmentClick: handleSegmentClick,
    onClearSelection: handleClearSelection,
    onFollowUpSubmit: handleFollowUpSubmit,
    onSkip: handleSkip,
    setFollowUpAnswers,
    getSubmitButtonText,
  };

  if (phase === "practice") {
    return <PracticePhase {...commonProps} phase={phase} />;
  }

  return <AnnotationPhase {...commonProps} />;
};
