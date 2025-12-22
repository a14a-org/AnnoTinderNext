import type { TextItem, SelectionRange, MultiSelectMode } from "@/features/annotation";

import { useState, useCallback, useMemo } from "react";

interface UseSegmentSelectionOptions {
  multiSelectMode: MultiSelectMode;
  maxSelectionsPerArticle: number;
}

export interface AnsweredSelection extends SelectionRange {
  /** Follow-up answers for this specific selection (per-selection mode) */
  answers: Record<string, string | number | null>;
}

export const useSegmentSelection = (
  currentText: TextItem | undefined,
  segments: string[],
  options: UseSegmentSelectionOptions
) => {
  const { multiSelectMode, maxSelectionsPerArticle } = options;

  // Current selections (not yet answered in per-selection mode)
  const [pendingSelections, setPendingSelections] = useState<SelectionRange[]>([]);

  // Selections that have been answered (per-selection mode only)
  const [answeredSelections, setAnsweredSelections] = useState<AnsweredSelection[]>([]);

  // Current selection being answered (for follow-up modal)
  const [currentSelection, setCurrentSelection] = useState<SelectionRange | null>(null);

  // Follow-up answers for current selection or batch
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string | number | null>>({});

  // Whether to show the follow-up modal
  const [showFollowUp, setShowFollowUp] = useState(false);

  // All selections (both pending and answered)
  const allSelections = useMemo(() => {
    return [...answeredSelections, ...pendingSelections];
  }, [answeredSelections, pendingSelections]);

  // Check if we can add more selections
  const canAddMore = useMemo(() => {
    return allSelections.length < maxSelectionsPerArticle;
  }, [allSelections.length, maxSelectionsPerArticle]);

  // Check if a segment is selected (by segmentIndex)
  const isSegmentSelected = useCallback(
    (segmentIndex: number) => {
      return allSelections.some((s) => s.segmentIndex === segmentIndex);
    },
    [allSelections]
  );

  // Check if a segment has been answered (per-selection mode)
  const isSegmentAnswered = useCallback(
    (segmentIndex: number) => {
      return answeredSelections.some((s) => s.segmentIndex === segmentIndex);
    },
    [answeredSelections]
  );

  // Calculate character indices for a segment
  const calculateIndices = useCallback(
    (segment: string, segmentIndex: number): { start: number; end: number } => {
      if (!currentText) return { start: 0, end: 0 };

      // Calculate start index by finding position after all previous segments
      let searchStart = 0;
      for (let i = 0; i < segmentIndex; i++) {
        const prevSegment = segments[i];
        const foundIndex = currentText.text.indexOf(prevSegment, searchStart);
        if (foundIndex >= 0) {
          searchStart = foundIndex + prevSegment.length;
        }
      }

      const actualStart = currentText.text.indexOf(segment, searchStart);
      const actualEnd = actualStart >= 0 ? actualStart + segment.length : 0;

      return { start: actualStart, end: actualEnd };
    },
    [currentText, segments]
  );

  const handleSegmentClick = useCallback(
    (segment: string, segmentIndex: number) => {
      if (!currentText) return;

      // Check if already selected
      const existingPendingIndex = pendingSelections.findIndex(
        (s) => s.segmentIndex === segmentIndex
      );
      const existingAnsweredIndex = answeredSelections.findIndex(
        (s) => s.segmentIndex === segmentIndex
      );

      // If already answered, don't allow deselection (user committed to it)
      if (existingAnsweredIndex >= 0) {
        return;
      }

      // If pending selection exists, toggle it off
      if (existingPendingIndex >= 0) {
        setPendingSelections((prev) =>
          prev.filter((s) => s.segmentIndex !== segmentIndex)
        );
        return;
      }

      // Check if we can add more
      if (!canAddMore) {
        return;
      }

      const { start, end } = calculateIndices(segment, segmentIndex);

      const newSelection: SelectionRange = {
        text: segment,
        startIndex: start,
        endIndex: end,
        segmentIndex,
      };

      if (multiSelectMode === "per-selection") {
        // Per-selection mode: immediately show follow-up for this selection
        setCurrentSelection(newSelection);
        setPendingSelections([newSelection]);
        setShowFollowUp(true);
        setFollowUpAnswers({});
      } else {
        // Batch mode: just add to pending selections
        setPendingSelections((prev) => [...prev, newSelection]);
      }
    },
    [
      currentText,
      pendingSelections,
      answeredSelections,
      canAddMore,
      calculateIndices,
      multiSelectMode,
    ]
  );

  // Called when user submits follow-up answers for current selection (per-selection mode)
  const submitCurrentSelection = useCallback(() => {
    if (!currentSelection) return;

    // Move current selection to answered with its answers
    const answeredSelection: AnsweredSelection = {
      ...currentSelection,
      answers: { ...followUpAnswers },
    };

    setAnsweredSelections((prev) => [...prev, answeredSelection]);
    setPendingSelections([]);
    setCurrentSelection(null);
    setShowFollowUp(false);
    setFollowUpAnswers({});
  }, [currentSelection, followUpAnswers]);

  // Start batch follow-up (batch mode) - shows modal for all pending selections
  const startBatchFollowUp = useCallback(() => {
    if (pendingSelections.length === 0) return;
    setShowFollowUp(true);
    setFollowUpAnswers({});
  }, [pendingSelections.length]);

  // Cancel current follow-up and clear pending selection (per-selection mode)
  const cancelCurrentFollowUp = useCallback(() => {
    setPendingSelections([]);
    setCurrentSelection(null);
    setShowFollowUp(false);
    setFollowUpAnswers({});
  }, []);

  // Reset all selections for next article
  const resetSelection = useCallback(() => {
    setPendingSelections([]);
    setAnsweredSelections([]);
    setCurrentSelection(null);
    setShowFollowUp(false);
    setFollowUpAnswers({});
  }, []);

  // Get all final selections with their answers for submission
  const getFinalSelections = useCallback((): AnsweredSelection[] => {
    if (multiSelectMode === "per-selection") {
      // All selections already have individual answers
      return answeredSelections;
    } else {
      // Batch mode: apply same answers to all pending selections
      return pendingSelections.map((selection) => ({
        ...selection,
        answers: { ...followUpAnswers },
      }));
    }
  }, [multiSelectMode, answeredSelections, pendingSelections, followUpAnswers]);

  // Legacy compatibility: get single selected text (first pending or current)
  const selectedText = useMemo(() => {
    if (currentSelection) return currentSelection.text;
    if (pendingSelections.length > 0) return pendingSelections[0].text;
    return null;
  }, [currentSelection, pendingSelections]);

  // Legacy compatibility: get single selected indices
  const selectedIndices = useMemo(() => {
    if (currentSelection) {
      return { start: currentSelection.startIndex, end: currentSelection.endIndex };
    }
    if (pendingSelections.length > 0) {
      return {
        start: pendingSelections[0].startIndex,
        end: pendingSelections[0].endIndex,
      };
    }
    return null;
  }, [currentSelection, pendingSelections]);

  return {
    // Multi-selection state
    pendingSelections,
    answeredSelections,
    allSelections,
    currentSelection,
    canAddMore,
    isSegmentSelected,
    isSegmentAnswered,

    // Follow-up state
    followUpAnswers,
    setFollowUpAnswers,
    showFollowUp,

    // Actions
    handleSegmentClick,
    submitCurrentSelection,
    startBatchFollowUp,
    cancelCurrentFollowUp,
    resetSelection,
    getFinalSelections,

    // Legacy compatibility (for backward compatibility with existing components)
    selectedText,
    selectedIndices,
  };
};
