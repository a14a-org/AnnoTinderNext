"use client";

import type { Question, AnswerValue } from "../../types";
import type { RefObject } from "react";

interface LongTextInputProps {
  question: Question;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  brandColor: string;
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  onSubmit: () => void;
}

export const LongTextInput = ({
  question,
  value,
  onChange,
  brandColor,
  inputRef,
  onSubmit,
}: LongTextInputProps) => (
  <textarea
    ref={inputRef as RefObject<HTMLTextAreaElement>}
    value={(value as string) || ""}
    onChange={(e) => onChange(e.target.value)}
    placeholder={question.placeholder || "Type your answer here..."}
    className="w-full text-xl border-0 border-b-2 border-gray-300 focus:border-current focus:ring-0 bg-transparent py-2 outline-none transition-colors resize-none"
    style={{ borderColor: value ? brandColor : undefined }}
    rows={3}
    onKeyDown={(e) => {
      if (e.key === "Enter" && e.metaKey) {
        onSubmit();
      }
    }}
  />
);
