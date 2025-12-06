"use client";

import type { Question, AnswerValue } from "../../types";

interface ChoiceInputProps {
  question: Question;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  brandColor: string;
}

export const ChoiceInput = ({
  question,
  value,
  onChange,
  brandColor,
}: ChoiceInputProps) => (
  <div className="space-y-3">
    {question.options.map((option, index) => (
      <button
        key={option.id}
        onClick={() => onChange(option.value)}
        className={`cursor-pointer w-full p-4 text-left rounded-lg border-2 transition-all flex items-center gap-3 ${
          value === option.value
            ? "border-current bg-opacity-10"
            : "border-gray-200 hover:border-gray-300"
        }`}
        style={{
          borderColor: value === option.value ? brandColor : undefined,
          backgroundColor:
            value === option.value ? `${brandColor}15` : undefined,
        }}
      >
        <span
          className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium"
          style={{
            borderColor: value === option.value ? brandColor : "#D1D5DB",
            backgroundColor: value === option.value ? brandColor : undefined,
            color: value === option.value ? "white" : "#6B7280",
          }}
        >
          {String.fromCharCode(65 + index)}
        </span>
        <span className="text-obsidian">{option.label}</span>
      </button>
    ))}
  </div>
);
