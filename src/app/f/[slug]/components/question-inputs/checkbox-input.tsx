"use client";

import type { Question, AnswerValue } from "../../types";

import { Check } from "lucide-react";

interface CheckboxInputProps {
  question: Question;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  brandColor: string;
}

export const CheckboxInput = ({
  question,
  value,
  onChange,
  brandColor,
}: CheckboxInputProps) => {
  const checkboxValue = (value as string[]) || [];

  return (
    <div className="space-y-3">
      {question.options.map((option, index) => (
        <button
          key={option.id}
          onClick={() => {
            if (checkboxValue.includes(option.value)) {
              onChange(checkboxValue.filter((v) => v !== option.value));
            } else {
              onChange([...checkboxValue, option.value]);
            }
          }}
          className={`cursor-pointer w-full p-4 text-left rounded-lg border-2 transition-all flex items-center gap-3 ${
            checkboxValue.includes(option.value)
              ? "border-current bg-opacity-10"
              : "border-gray-200 hover:border-gray-300"
          }`}
          style={{
            borderColor: checkboxValue.includes(option.value)
              ? brandColor
              : undefined,
            backgroundColor: checkboxValue.includes(option.value)
              ? `${brandColor}15`
              : undefined,
          }}
        >
          <span
            className="w-6 h-6 rounded border-2 flex items-center justify-center text-xs font-medium"
            style={{
              borderColor: checkboxValue.includes(option.value)
                ? brandColor
                : "#D1D5DB",
              backgroundColor: checkboxValue.includes(option.value)
                ? brandColor
                : undefined,
            }}
          >
            {checkboxValue.includes(option.value) && (
              <Check className="w-4 h-4 text-white" />
            )}
          </span>
          <span className="text-obsidian">{option.label}</span>
          <span className="ml-auto text-xs text-gray-400">
            {String.fromCharCode(65 + index)}
          </span>
        </button>
      ))}
    </div>
  );
};
