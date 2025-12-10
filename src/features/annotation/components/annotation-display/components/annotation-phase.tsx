import type { TextAnnotationSettings } from "@/features/annotation";

import { motion } from "framer-motion";
import { Clock } from "lucide-react";

import { TextDisplay } from "./text-display";
import { FollowUpModal } from "./follow-up-modal";
import { InstructionPanel } from "./instruction-panel";

interface AnnotationPhaseProps {
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
  isTimeCompleted?: boolean;
  timeLeft?: number;
  onSegmentClick: (segment: string, index: number) => void;
  onClearSelection: () => void;
  onFollowUpSubmit: () => void;
  onSkip: () => void;
  setFollowUpAnswers: (answers: Record<string, string | number | null> | ((prev: Record<string, string | number | null>) => Record<string, string | number | null>)) => void;
  getSubmitButtonText: () => string;
}

export const AnnotationPhase = ({
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
  isTimeCompleted = true,
  timeLeft = 0,
  onSegmentClick,
  onClearSelection,
  onFollowUpSubmit,
  onSkip,
  setFollowUpAnswers,
  getSubmitButtonText,
}: AnnotationPhaseProps) => {
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>
            Text {currentIndex + 1} of {totalTexts}
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
      <InstructionPanel instructionText={settings.instructionText} />

      {/* Timer Warning */}
      {!isTimeCompleted && (
        <div className="flex items-center justify-center gap-2 mb-4 text-sm text-orange-600 font-medium bg-orange-50 py-2 rounded-lg">
          <Clock className="w-4 h-4" />
          <span>Please read for {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")} before continuing</span>
        </div>
      )}

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
        isTimeCompleted={isTimeCompleted}
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
            disabled={isSaving || !isTimeCompleted}
            className="text-sm text-gray-500 hover:text-gray-700 underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : settings.skipButtonText || "Skip this text"}
          </button>
        </div>
      )}
    </div>
  );
};
