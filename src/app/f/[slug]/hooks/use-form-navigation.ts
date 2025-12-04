"use client";

import { useCallback, useState } from "react";

interface UseFormNavigationResult {
  currentIndex: number;
  direction: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  goNext: () => void;
  goPrevious: () => void;
  navigateTo: (index: number, dir: number) => void;
}

export const useFormNavigation = (
  maxIndex: number,
  isThankYou: boolean
): UseFormNavigationResult => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const goNext = useCallback(() => {
    if (currentIndex < maxIndex) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, maxIndex]);

  const goPrevious = useCallback(() => {
    if (currentIndex > 0 && !isThankYou) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex, isThankYou]);

  const navigateTo = useCallback((index: number, dir: number) => {
    setDirection(dir);
    setCurrentIndex(index);
  }, []);

  return {
    currentIndex,
    direction,
    setCurrentIndex,
    goNext,
    goPrevious,
    navigateTo,
  };
};
