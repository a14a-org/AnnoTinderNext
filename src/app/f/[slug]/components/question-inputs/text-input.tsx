"use client";

import type { Question, AnswerValue } from "../../types";
import type { RefObject } from "react";

import { getInputType } from "../../utils";

interface TextInputProps {
  question: Question;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  brandColor: string;
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
}

export const TextInput = ({
  question,
  value,
  onChange,
  brandColor,
  inputRef,
}: TextInputProps) => (
  <input
    ref={inputRef as RefObject<HTMLInputElement>}
    type={getInputType(question.type)}
    value={(value as string) || ""}
    onChange={(e) => onChange(e.target.value)}
    placeholder={question.placeholder || "Type your answer here..."}
    autoFocus
    className="w-full text-xl border-0 border-b-2 border-gray-300 focus:border-current focus:ring-0 bg-transparent py-2 outline-none transition-colors"
    style={{ borderColor: value ? brandColor : undefined }}
  />
);
