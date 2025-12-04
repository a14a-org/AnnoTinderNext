"use client";

import type { AnswerValue, Question } from "../types";

import { useCallback, useState } from "react";

interface UseFormAnswersResult {
  answers: Record<string, AnswerValue>;
  setAnswer: (questionId: string, value: AnswerValue) => void;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, AnswerValue>>>;
  canProceed: (question: Question | undefined, isSpecialScreen: boolean) => boolean;
}

export const useFormAnswers = (): UseFormAnswersResult => {
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});

  const setAnswer = useCallback((questionId: string, value: AnswerValue) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  }, []);

  const canProceed = useCallback(
    (question: Question | undefined, isSpecialScreen: boolean) => {
      if (!question) return false;
      if (isSpecialScreen) return false;

      // Welcome and Thank You screens can always proceed
      if (question.type === "WELCOME_SCREEN" || question.type === "THANK_YOU_SCREEN") {
        return true;
      }

      const answer = answers[question.id];
      if (!question.isRequired) return true;

      if (answer === undefined || answer === null || answer === "") return false;
      if (Array.isArray(answer) && answer.length === 0) return false;

      return true;
    },
    [answers]
  );

  return { answers, setAnswer, setAnswers, canProceed };
};
