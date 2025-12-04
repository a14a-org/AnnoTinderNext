import type { TextAnnotationSettings } from "@/features/annotation";
import type { Phase } from "../types";

import { motion } from "framer-motion";

import { TextDisplay } from "./text-display";
import { FollowUpModal } from "./follow-up-modal";

interface PracticePhaseProps {
  phase: Phase;
  currentIndex: number;
  totalTexts: number;
  progress: number;
  brandColor: string;
  settings: TextAnnotationSettings;
  segments: string[];
  selectedText: string | null;
  showFollowUp: boolean;
  followUpAnswers: Record<string, string | number | null>;
  isSaving: boolean;
  onSegmentClick: (segment: string, index: number) => void;
  onClearSelection: () => void;
  onFollowUpSubmit: () => void;
  onSkip: () => void;
  setFollowUpAnswers: (answers: Record<string, string | number | null> | ((prev: Record<string, string | number | null>) => Record<string, string | number | null>)) => void;
  getSubmitButtonText: () => string;
}

export const PracticePhase = ({
  phase,
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
  onSegmentClick,
  onClearSelection,
  onFollowUpSubmit,
  onSkip,
  setFollowUpAnswers,
  getSubmitButtonText,
}: PracticePhaseProps) => {
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Phase indicator for practice */}
      {phase === "practice" && (
        <div className="mb-4 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-center">
          <span className="text-xs font-medium text-amber-800">
            Practice Round - {currentIndex + 1} of {totalTexts}
          </span>
        </div>
      )}

      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>
            {phase === "practice" ? "Practice" : "Text"} {currentIndex + 1} of {totalTexts}
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

      {/* Instruction */}
      <p className="text-sm text-gray-600 mb-4 text-center">
        {settings.instructionText}
      </p>

      {/* Text display with selectable segments */}
      <TextDisplay
        segments={segments}
        selectedText={selectedText}
        selectionMode={settings.selectionMode}
        highlightColor={settings.highlightColor}
        brandColor={brandColor}
        currentIndex={currentIndex}
        onSegmentClick={onSegmentClick}
      />

      {/* Follow-up questions panel */}
      <FollowUpModal
        showFollowUp={showFollowUp}
        selectedText={selectedText}
        highlightColor={settings.highlightColor}
        brandColor={brandColor}
        settings={settings}
        followUpAnswers={followUpAnswers}
        isSaving={isSaving}
        onClearSelection={onClearSelection}
        onFollowUpSubmit={onFollowUpSubmit}
        setFollowUpAnswers={setFollowUpAnswers}
        getSubmitButtonText={getSubmitButtonText}
      />

      {/* Skip button */}
      {settings.allowSkip && !showFollowUp && (
        <div className="text-center">
          <button
            onClick={onSkip}
            disabled={isSaving}
            className="text-sm text-gray-500 hover:text-gray-700 underline disabled:opacity-50"
          >
            {isSaving ? "Saving..." : settings.skipButtonText || "Skip this text"}
          </button>
        </div>
      )}
    </div>
  );
};
