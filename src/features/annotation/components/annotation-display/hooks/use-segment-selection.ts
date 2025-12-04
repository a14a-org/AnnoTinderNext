import type { TextItem } from "@/features/annotation";

import { useState, useCallback } from "react";

export const useSegmentSelection = (currentText: TextItem | undefined, segments: string[]) => {
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string | number | null>>({});
  const [showFollowUp, setShowFollowUp] = useState(false);

  const handleSegmentClick = useCallback(
    (segment: string, index: number) => {
      if (!currentText) return;

      // Calculate start/end indices in original text using reduce
      const startIndex = segments.slice(0, index).reduce((acc, seg) => {
        return currentText.text.indexOf(seg, acc) + seg.length;
      }, 0);
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

  return {
    selectedText,
    selectedIndices,
    followUpAnswers,
    setFollowUpAnswers,
    showFollowUp,
    handleSegmentClick,
    resetSelection,
  };
};
