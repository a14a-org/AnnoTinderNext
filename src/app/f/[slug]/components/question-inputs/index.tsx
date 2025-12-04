"use client";

import type { Question, AnswerValue } from "../../types";
import type { RefObject } from "react";

import { TextInput } from "./text-input";
import { LongTextInput } from "./long-text-input";
import { ChoiceInput } from "./choice-input";
import { CheckboxInput } from "./checkbox-input";
import { RatingInput } from "./rating-input";
import { YesNoInput } from "./yes-no-input";
import { DateInput } from "./date-input";

interface QuestionInputProps {
  question: Question;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  brandColor: string;
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  onSubmit: () => void;
}

export const QuestionInput = ({
  question,
  value,
  onChange,
  brandColor,
  inputRef,
  onSubmit,
}: QuestionInputProps) => {
  switch (question.type) {
    case "SHORT_TEXT":
    case "EMAIL":
    case "NUMBER":
      return (
        <TextInput
          question={question}
          value={value}
          onChange={onChange}
          brandColor={brandColor}
          inputRef={inputRef}
        />
      );

    case "LONG_TEXT":
      return (
        <LongTextInput
          question={question}
          value={value}
          onChange={onChange}
          brandColor={brandColor}
          inputRef={inputRef}
          onSubmit={onSubmit}
        />
      );

    case "MULTIPLE_CHOICE":
    case "DROPDOWN":
      return (
        <ChoiceInput
          question={question}
          value={value}
          onChange={onChange}
          brandColor={brandColor}
        />
      );

    case "CHECKBOXES":
      return (
        <CheckboxInput
          question={question}
          value={value}
          onChange={onChange}
          brandColor={brandColor}
        />
      );

    case "RATING":
      return (
        <RatingInput
          value={value}
          onChange={onChange}
          brandColor={brandColor}
        />
      );

    case "YES_NO":
      return (
        <YesNoInput
          value={value}
          onChange={onChange}
          brandColor={brandColor}
        />
      );

    case "DATE":
      return (
        <DateInput
          value={value}
          onChange={onChange}
          brandColor={brandColor}
          inputRef={inputRef}
        />
      );

    default:
      return null;
  }
};

export { TextInput } from "./text-input";
export { LongTextInput } from "./long-text-input";
export { ChoiceInput } from "./choice-input";
export { CheckboxInput } from "./checkbox-input";
export { RatingInput } from "./rating-input";
export { YesNoInput } from "./yes-no-input";
export { DateInput } from "./date-input";
