"use client";

import type { AnswerValue } from "../../types";
import type { RefObject } from "react";

interface DateInputProps {
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  brandColor: string;
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
}

export const DateInput = ({
  value,
  onChange,
  brandColor,
  inputRef,
}: DateInputProps) => (
  <input
    ref={inputRef as RefObject<HTMLInputElement>}
    type="date"
    value={(value as string) || ""}
    onChange={(e) => onChange(e.target.value)}
    className="w-full text-xl border-0 border-b-2 border-gray-300 focus:border-current focus:ring-0 bg-transparent py-2 outline-none transition-colors"
    style={{ borderColor: value ? brandColor : undefined }}
  />
);
