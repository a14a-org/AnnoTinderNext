import type { Question } from "@/app/form/[formId]/edit/types";
import { isChoiceType } from "@/app/form/[formId]/edit/constants";

export interface ValidationError {
  questionId: string;
  message: string;
}

export const validateForm = (questions: Question[]): ValidationError[] => {
  const errors: ValidationError[] = [];

  questions.forEach((question) => {
    // 1. Check if title is empty
    if (!question.title || question.title.trim() === "") {
      errors.push({
        questionId: question.id,
        message: "Question title is required",
      });
    }

    // 2. Check if choice questions have empty options
    if (isChoiceType(question.type)) {
      const hasEmptyOption = question.options.some(
        (opt) => !opt.label || opt.label.trim() === ""
      );
      if (hasEmptyOption) {
        errors.push({
          questionId: question.id,
          message: "All options must have a label",
        });
      }
    }
  });

  return errors;
};

