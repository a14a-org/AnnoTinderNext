import type { SelectionMode } from "@/features/annotation";

import { AnimatePresence, motion } from "framer-motion";

interface TextDisplayProps {
  segments: string[];
  selectionMode: SelectionMode;
  highlightColor: string;
  brandColor: string;
  currentIndex: number;
  onSegmentClick: (segment: string, index: number) => void;
  /** Check if a segment is currently selected */
  isSegmentSelected: (segmentIndex: number) => boolean;
  /** Check if a segment has been answered (per-selection mode) */
  isSegmentAnswered: (segmentIndex: number) => boolean;
  /** Whether user can add more selections */
  canAddMore: boolean;
  /** @deprecated Use isSegmentSelected instead */
  selectedText?: string | null;
}

export const TextDisplay = ({
  segments,
  selectionMode,
  highlightColor,
  brandColor,
  currentIndex,
  onSegmentClick,
  isSegmentSelected,
  isSegmentAnswered,
  canAddMore,
}: TextDisplayProps) => {
  const getSegmentStyle = (index: number) => {
    const isSelected = isSegmentSelected(index);
    const isAnswered = isSegmentAnswered(index);

    if (isAnswered) {
      // Answered selections: solid highlight with checkmark indicator
      return {
        backgroundColor: highlightColor,
        borderColor: brandColor,
        opacity: 0.9,
      };
    }

    if (isSelected) {
      // Pending selection: highlight with ring
      return {
        backgroundColor: highlightColor,
        borderColor: brandColor,
      };
    }

    return {};
  };

  const getSegmentClassName = (index: number) => {
    const isSelected = isSegmentSelected(index);
    const isAnswered = isSegmentAnswered(index);

    const baseClasses = "transition-all duration-200 rounded px-1";

    if (isAnswered) {
      // Answered: show as committed, not clickable
      return `${baseClasses} cursor-default ring-2 ring-offset-1`;
    }

    if (isSelected) {
      // Selected but not answered: can be deselected
      return `${baseClasses} cursor-pointer ring-2 ring-offset-1`;
    }

    if (!canAddMore) {
      // Max selections reached: not clickable
      return `${baseClasses} cursor-not-allowed opacity-60`;
    }

    // Default: clickable
    return `${baseClasses} cursor-pointer hover:bg-gray-100`;
  };

  const handleClick = (segment: string, index: number) => {
    const isAnswered = isSegmentAnswered(index);
    const isSelected = isSegmentSelected(index);

    // Don't allow clicking on answered segments
    if (isAnswered) return;

    // Don't allow adding if max reached (but allow deselecting)
    if (!canAddMore && !isSelected) return;

    onSegmentClick(segment, index);
  };

  return (
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
          {selectionMode === "sentence" ? (
            // Sentence mode: render sentences as clickable blocks
            <div className="space-y-2">
              {segments.map((segment, index) => {
                const isAnswered = isSegmentAnswered(index);

                return (
                  <span
                    key={index}
                    onClick={() => handleClick(segment, index)}
                    className={`inline ${getSegmentClassName(index)} -mx-1`}
                    style={getSegmentStyle(index)}
                  >
                    {isAnswered && (
                      <span className="text-xs mr-1" title="Beantwoord">
                        ✓
                      </span>
                    )}
                    {segment}{" "}
                  </span>
                );
              })}
            </div>
          ) : (
            // Word mode: render words as clickable spans
            <div className="flex flex-wrap gap-1">
              {segments.map((segment, index) => {
                const isAnswered = isSegmentAnswered(index);

                return (
                  <span
                    key={index}
                    onClick={() => handleClick(segment, index)}
                    className={getSegmentClassName(index)}
                    style={getSegmentStyle(index)}
                  >
                    {isAnswered && (
                      <span className="text-xs mr-0.5" title="Beantwoord">
                        ✓
                      </span>
                    )}
                    {segment}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
