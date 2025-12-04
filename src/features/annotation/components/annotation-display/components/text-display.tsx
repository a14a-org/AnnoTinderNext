import type { SelectionMode } from "@/features/annotation";

import { AnimatePresence, motion } from "framer-motion";

interface TextDisplayProps {
  segments: string[];
  selectedText: string | null;
  selectionMode: SelectionMode;
  highlightColor: string;
  brandColor: string;
  currentIndex: number;
  onSegmentClick: (segment: string, index: number) => void;
}

export const TextDisplay = ({
  segments,
  selectedText,
  selectionMode,
  highlightColor,
  brandColor,
  currentIndex,
  onSegmentClick,
}: TextDisplayProps) => {
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
              {segments.map((segment, index) => (
                <span
                  key={index}
                  onClick={() => onSegmentClick(segment, index)}
                  className={`inline cursor-pointer transition-all duration-200 rounded px-1 -mx-1 ${
                    selectedText === segment
                      ? "ring-2 ring-offset-1"
                      : "hover:bg-gray-100"
                  }`}
                  style={{
                    backgroundColor:
                      selectedText === segment
                        ? highlightColor
                        : undefined,
                    borderColor:
                      selectedText === segment ? brandColor : undefined,
                  }}
                >
                  {segment}{" "}
                </span>
              ))}
            </div>
          ) : (
            // Word mode: render words as clickable spans
            <div className="flex flex-wrap gap-1">
              {segments.map((segment, index) => (
                <span
                  key={index}
                  onClick={() => onSegmentClick(segment, index)}
                  className={`cursor-pointer transition-all duration-200 rounded px-1 ${
                    selectedText === segment
                      ? "ring-2 ring-offset-1"
                      : "hover:bg-gray-100"
                  }`}
                  style={{
                    backgroundColor:
                      selectedText === segment
                        ? highlightColor
                        : undefined,
                    borderColor:
                      selectedText === segment ? brandColor : undefined,
                  }}
                >
                  {segment}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
