"use client";

import type { Annotation, SelectionRange } from "@/features/annotation";
import type { AnnotationDisplayProps } from "./types";
import type { AnsweredSelection } from "./hooks/use-segment-selection";

import { useCallback, useMemo } from "react";

import { ErrorBoundary } from "@/components/ui";
import { useAnnotationState, useSegmentSelection, useAnnotationApi, useMinimumTime } from "./hooks";
import { PracticePhase, TransitionPhase, AnnotationPhase } from "./components";
import { splitIntoSegments } from "./utils/segment-utils";
import { DEFAULT_BRAND_COLOR } from "@/config/theme";

export const AnnotationDisplay = ({
  settings,
  brandColor = DEFAULT_BRAND_COLOR,
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
    // Nothing found tracking
    nothingFoundCount,
    canUseNothingFound,
    incrementNothingFoundCount,
    maxNothingFoundPerSession,
  } = useAnnotationState(settings);

  // Timer for minimum time on page
  const { isCompleted: isTimeCompleted, timeLeft, resetTimer } = useMinimumTime(
    settings.minimumTimeOnPage ?? 5
  );

  // Split text based on selection mode
  const segments = useMemo(() => {
    return splitIntoSegments(currentText, settings.selectionMode);
  }, [currentText, settings.selectionMode]);

  // Multi-select options
  const multiSelectOptions = useMemo(() => ({
    multiSelectMode: settings.multiSelectMode ?? "per-selection",
    maxSelectionsPerArticle: settings.maxSelectionsPerArticle ?? 10,
  }), [settings.multiSelectMode, settings.maxSelectionsPerArticle]);

  // Segment selection with multi-select support
  const {
    pendingSelections,
    answeredSelections,
    allSelections,
    currentSelection,
    canAddMore,
    isSegmentSelected,
    isSegmentAnswered,
    followUpAnswers,
    setFollowUpAnswers,
    showFollowUp,
    handleSegmentClick,
    submitCurrentSelection,
    startBatchFollowUp,
    cancelCurrentFollowUp,
    resetSelection,
    getFinalSelections,
    // Legacy compatibility
    selectedText,
    selectedIndices,
  } = useSegmentSelection(currentText, segments, multiSelectOptions);

  // API hooks
  const { saveAnnotationToApi, completeSession } = useAnnotationApi(
    sessionToken,
    formId
  );

  // Handle transition to main phase
  const handleStartMain = useCallback(() => {
    resetForMainPhase();
    resetTimer();
  }, [resetForMainPhase, resetTimer]);

  // Helper to create annotation from selections
  const createAnnotationFromSelections = useCallback((
    selections: AnsweredSelection[],
    skipped: boolean = false
  ): Annotation => {
    if (!currentText) {
      throw new Error("No current text");
    }

    // For backward compatibility, use first selection for legacy fields
    const firstSelection = selections[0];

    // Combine all answers (for per-selection mode, merge all answers)
    const combinedAnswers: Record<string, string | number | null> = {};
    selections.forEach((sel, idx) => {
      Object.entries(sel.answers).forEach(([key, value]) => {
        // Prefix with selection index for per-selection mode
        if (settings.multiSelectMode === "per-selection" && selections.length > 1) {
          combinedAnswers[`${idx}_${key}`] = value;
        } else {
          combinedAnswers[key] = value;
        }
      });
    });

    // Convert to SelectionRange array (without the answers property)
    const selectionRanges: SelectionRange[] = selections.map((sel) => ({
      text: sel.text,
      startIndex: sel.startIndex,
      endIndex: sel.endIndex,
      segmentIndex: sel.segmentIndex,
    }));

    return {
      textId: currentText.id,
      // Legacy fields (for backward compatibility)
      selectedText: firstSelection?.text ?? "",
      startIndex: firstSelection?.startIndex ?? 0,
      endIndex: firstSelection?.endIndex ?? 0,
      // New multi-selection field
      selections: selectionRanges,
      followUpAnswers: combinedAnswers,
      skipped,
    };
  }, [currentText, settings.multiSelectMode]);

  // Handle follow-up submit (per-selection mode: after answering one selection)
  const handleFollowUpSubmit = useCallback(async () => {
    if (settings.multiSelectMode === "per-selection") {
      // Per-selection mode: just mark current selection as answered, stay on article
      submitCurrentSelection();
    } else {
      // Batch mode: save all selections and move to next article
      if (!currentText) return;

      setIsSaving(true);

      const finalSelections = getFinalSelections();
      const annotation = createAnnotationFromSelections(finalSelections);

      // Only save to API during main phase (not practice)
      if (phase === "main") {
        await saveAnnotationToApi(annotation, currentText.id);
      }

      const newAnnotations = [...annotations, annotation];
      setAnnotations(newAnnotations);

      // Move to next text or complete/transition
      const isDone = nextText();
      resetTimer();

      if (isDone) {
        if (phase === "practice") {
          transitionToMain();
          resetSelection();
        } else {
          const redirectUrl = await completeSession();
          onComplete(newAnnotations);
          if (redirectUrl) {
            window.location.href = redirectUrl;
          }
        }
      } else {
        resetSelection();
      }

      setIsSaving(false);
    }
  }, [
    settings.multiSelectMode,
    submitCurrentSelection,
    currentText,
    getFinalSelections,
    createAnnotationFromSelections,
    phase,
    annotations,
    saveAnnotationToApi,
    completeSession,
    onComplete,
    resetSelection,
    setIsSaving,
    setAnnotations,
    nextText,
    transitionToMain,
    resetTimer,
  ]);

  // Handle "Done with article" button (per-selection mode)
  const handleDoneWithArticle = useCallback(async () => {
    if (!currentText) return;

    setIsSaving(true);

    // Get all answered selections
    const finalSelections = getFinalSelections();
    const annotation = createAnnotationFromSelections(finalSelections);

    // Only save to API during main phase (not practice)
    if (phase === "main") {
      await saveAnnotationToApi(annotation, currentText.id);
    }

    const newAnnotations = [...annotations, annotation];
    setAnnotations(newAnnotations);

    // Move to next text or complete/transition
    const isDone = nextText();
    resetTimer();

    if (isDone) {
      if (phase === "practice") {
        transitionToMain();
        resetSelection();
      } else {
        const redirectUrl = await completeSession();
        onComplete(newAnnotations);
        if (redirectUrl) {
          window.location.href = redirectUrl;
        }
      }
    } else {
      resetSelection();
    }

    setIsSaving(false);
  }, [
    currentText,
    getFinalSelections,
    createAnnotationFromSelections,
    phase,
    annotations,
    saveAnnotationToApi,
    completeSession,
    onComplete,
    resetSelection,
    setIsSaving,
    setAnnotations,
    nextText,
    transitionToMain,
    resetTimer,
  ]);

  // Handle "Nothing found" button
  const handleNothingFound = useCallback(async () => {
    if (!currentText) return;

    setIsSaving(true);
    incrementNothingFoundCount();

    const annotation: Annotation = {
      textId: currentText.id,
      selectedText: "",
      startIndex: 0,
      endIndex: 0,
      selections: [],
      followUpAnswers: {},
      skipped: true, // "Nothing found" is recorded as skipped
    };

    // Only save to API during main phase (not practice)
    if (phase === "main") {
      await saveAnnotationToApi(annotation, currentText.id);
    }

    const newAnnotations = [...annotations, annotation];
    setAnnotations(newAnnotations);

    const isDone = nextText();
    resetTimer();

    if (isDone) {
      if (phase === "practice") {
        transitionToMain();
        resetSelection();
      } else {
        const redirectUrl = await completeSession();
        onComplete(newAnnotations);
        if (redirectUrl) {
          window.location.href = redirectUrl;
        }
      }
    } else {
      resetSelection();
    }

    setIsSaving(false);
  }, [
    currentText,
    incrementNothingFoundCount,
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

  // Handle clear/cancel selection
  const handleClearSelection = useCallback(() => {
    cancelCurrentFollowUp();
  }, [cancelCurrentFollowUp]);

  // Show transition screen between practice and main phase
  if (phase === "transition") {
    return (
      <ErrorBoundary>
        <TransitionPhase
          brandColor={brandColor}
          textsCount={texts.length}
          onStartMain={handleStartMain}
        />
      </ErrorBoundary>
    );
  }

  if (!currentText) {
    return (
      <div className="text-center text-gray-500 py-8">
        Geen teksten om te annoteren
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
    showFollowUp,
    followUpAnswers,
    isSaving,
    isTimeCompleted,
    timeLeft,
    onSegmentClick: handleSegmentClick,
    onClearSelection: handleClearSelection,
    onFollowUpSubmit: handleFollowUpSubmit,
    onNothingFound: handleNothingFound,
    onDoneWithArticle: handleDoneWithArticle,
    onStartBatchFollowUp: startBatchFollowUp,
    setFollowUpAnswers,
    getSubmitButtonText,
    // Multi-selection props
    isSegmentSelected,
    isSegmentAnswered,
    canAddMore,
    allSelections,
    answeredSelections,
    pendingSelections,
    currentSelection,
    multiSelectMode: settings.multiSelectMode ?? "per-selection",
    maxSelectionsPerArticle: settings.maxSelectionsPerArticle ?? 10,
    // Nothing found
    canUseNothingFound,
    nothingFoundCount,
    maxNothingFoundPerSession,
    // Legacy
    selectedText,
  };

  if (phase === "practice") {
    return (
      <ErrorBoundary>
        <PracticePhase {...commonProps} phase={phase} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <AnnotationPhase {...commonProps} />
    </ErrorBoundary>
  );
};
