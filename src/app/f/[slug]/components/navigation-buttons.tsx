"use client";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface NavigationButtonsProps {
  currentIndex: number;
  isThankYou: boolean;
  canProceed: boolean;
  isSubmitting: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export const NavigationButtons = ({
  currentIndex,
  isThankYou,
  canProceed,
  isSubmitting,
  onPrevious,
  onNext,
}: NavigationButtonsProps) => (
  <div className="fixed bottom-8 left-8 z-40 flex items-center gap-2">
    {currentIndex > 0 && !isThankYou && (
      <button
        onClick={onPrevious}
        className="p-3 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
      >
        <ChevronLeft className="w-5 h-5 text-obsidian" />
      </button>
    )}
    {!isThankYou && (
      <button
        onClick={onNext}
        disabled={!canProceed || isSubmitting}
        className="p-3 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        {isSubmitting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <ChevronRight className="w-5 h-5 text-obsidian" />
        )}
      </button>
    )}
  </div>
);
