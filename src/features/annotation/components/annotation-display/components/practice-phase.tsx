import type { TextAnnotationSettings, SelectionRange, MultiSelectMode } from "@/features/annotation";
import type { Phase } from "../types";

import { motion } from "framer-motion";
import { Clock, CheckCircle } from "lucide-react";

import { TextDisplay } from "./text-display";
import { FollowUpModal } from "./follow-up-modal";
import { InstructionPanel } from "./instruction-panel";

interface PracticePhaseProps {
  phase: Phase;
  currentIndex: number;
  totalTexts: number;
  progress: number;
  brandColor: string;
  settings: TextAnnotationSettings;
  segments: string[];
  showFollowUp: boolean;
  followUpAnswers: Record<string, string | number | null>;
  isSaving: boolean;
  isTimeCompleted?: boolean;
  timeLeft?: number;
  onSegmentClick: (segment: string, index: number) => void;
  onClearSelection: () => void;
  onFollowUpSubmit: () => void;
  onNothingFound: () => void;
  onDoneWithArticle: () => void;
  onStartBatchFollowUp: () => void;
  setFollowUpAnswers: (answers: Record<string, string | number | null> | ((prev: Record<string, string | number | null>) => Record<string, string | number | null>)) => void;
  getSubmitButtonText: () => string;
  // Multi-selection props
  isSegmentSelected: (segmentIndex: number) => boolean;
  isSegmentAnswered: (segmentIndex: number) => boolean;
  canAddMore: boolean;
  allSelections: SelectionRange[];
  answeredSelections: SelectionRange[];
  pendingSelections: SelectionRange[];
  currentSelection: SelectionRange | null;
  multiSelectMode: MultiSelectMode;
  maxSelectionsPerArticle: number;
  // Nothing found
  canUseNothingFound: boolean;
  nothingFoundCount: number;
  maxNothingFoundPerSession: number;
  /** @deprecated */
  selectedText?: string | null;
}

export const PracticePhase = ({
  phase,
  currentIndex,
  totalTexts,
  progress,
  brandColor,
  settings,
  segments,
  showFollowUp,
  followUpAnswers,
  isSaving,
  isTimeCompleted = true,
  timeLeft = 0,
  onSegmentClick,
  onClearSelection,
  onFollowUpSubmit,
  onNothingFound,
  onDoneWithArticle,
  onStartBatchFollowUp,
  setFollowUpAnswers,
  getSubmitButtonText,
  isSegmentSelected,
  isSegmentAnswered,
  canAddMore,
  allSelections,
  answeredSelections,
  pendingSelections,
  currentSelection,
  multiSelectMode,
  maxSelectionsPerArticle,
  canUseNothingFound,
  nothingFoundCount,
  maxNothingFoundPerSession,
}: PracticePhaseProps) => {
  // Determine button visibility based on mode and selection state
  const hasAnsweredSelections = answeredSelections.length > 0;
  const hasPendingSelections = pendingSelections.length > 0;
  const hasAnySelections = allSelections.length > 0;

  // Show "Done with article" button in per-selection mode after at least 1 answered selection
  const showDoneButton = multiSelectMode === "per-selection" && hasAnsweredSelections && !showFollowUp;

  // Show "Confirm selections" button in batch mode when there are pending selections
  const showConfirmButton = multiSelectMode === "batch" && hasPendingSelections && !showFollowUp;

  // Show "Nothing found" button only when no selections have been made
  const showNothingFoundButton = !hasAnySelections && canUseNothingFound && !showFollowUp;

  // Calculate remaining "nothing found" uses
  const remainingNothingFound = maxNothingFoundPerSession === 0
    ? Infinity
    : maxNothingFoundPerSession - nothingFoundCount;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Phase indicator for practice */}
      {phase === "practice" && (
        <div className="mb-4 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-center">
          <span className="text-sm font-medium text-amber-800">
            Oefenronde - {currentIndex + 1} van {totalTexts}
          </span>
        </div>
      )}

      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>
            {phase === "practice" ? "Oefening" : "Artikel"} {currentIndex + 1} van {totalTexts}
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

      {/* Selection counter */}
      {hasAnySelections && !showFollowUp && (
        <div className="flex items-center justify-between mb-4 text-sm bg-gray-50 py-2 px-4 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-gray-700">
              Geselecteerd: {allSelections.length}
              {maxSelectionsPerArticle < Infinity && ` / ${maxSelectionsPerArticle}`}
            </span>
          </div>
          {multiSelectMode === "per-selection" && hasAnsweredSelections && (
            <span className="text-green-600 font-medium">
              {answeredSelections.length} beantwoord
            </span>
          )}
        </div>
      )}

      {/* Timer Warning */}
      {!isTimeCompleted && (
        <div className="flex items-center justify-center gap-2 mb-4 text-sm text-orange-600 font-medium bg-orange-50 py-2 rounded-lg">
          <Clock className="w-4 h-4" />
          <span>
            Lees nog {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")} voordat je verder kunt
          </span>
        </div>
      )}

      {/* Text display with selectable segments */}
      <TextDisplay
        segments={segments}
        selectionMode={settings.selectionMode}
        highlightColor={settings.highlightColor}
        brandColor={brandColor}
        currentIndex={currentIndex}
        onSegmentClick={onSegmentClick}
        isSegmentSelected={isSegmentSelected}
        isSegmentAnswered={isSegmentAnswered}
        canAddMore={canAddMore}
      />

      {/* Follow-up questions panel */}
      <FollowUpModal
        showFollowUp={showFollowUp}
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
        multiSelectMode={multiSelectMode}
        currentSelection={currentSelection}
        pendingSelections={pendingSelections}
      />

      {/* Action buttons */}
      <div className="space-y-3">
        {/* Done with article button (per-selection mode) */}
        {showDoneButton && (
          <button
            onClick={onDoneWithArticle}
            disabled={isSaving || !isTimeCompleted}
            className="w-full py-3 rounded-lg font-medium text-white transition-all cursor-pointer hover:brightness-110 active:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: brandColor }}
          >
            {isSaving ? "Opslaan..." : "Klaar met dit artikel"}
          </button>
        )}

        {/* Confirm selections button (batch mode) */}
        {showConfirmButton && (
          <button
            onClick={onStartBatchFollowUp}
            disabled={isSaving || !isTimeCompleted}
            className="w-full py-3 rounded-lg font-medium text-white transition-all cursor-pointer hover:brightness-110 active:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: brandColor }}
          >
            Bevestig selecties ({pendingSelections.length})
          </button>
        )}

        {/* Nothing found button */}
        {showNothingFoundButton && (
          <div className="text-center">
            <button
              onClick={onNothingFound}
              disabled={isSaving || !isTimeCompleted}
              className="text-sm text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Opslaan..." : settings.nothingFoundButtonText || "Ik vind geen schadelijke zin in dit artikel"}
            </button>
            {remainingNothingFound !== Infinity && remainingNothingFound > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Nog {remainingNothingFound} keer beschikbaar
              </p>
            )}
          </div>
        )}

        {/* Hint text when no selections and follow-up not shown */}
        {!hasAnySelections && !showFollowUp && !showNothingFoundButton && (
          <p className="text-center text-sm text-gray-400">
            Klik op een zin om deze te selecteren
          </p>
        )}
      </div>
    </div>
  );
};
