"use client";

import type { AnswerValue } from "../../types";

interface RatingInputProps {
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  brandColor: string;
}

export const RatingInput = ({
  value,
  onChange,
  brandColor,
}: RatingInputProps) => (
  <div className="flex gap-3">
    {[1, 2, 3, 4, 5].map((num) => (
      <button
        key={num}
        onClick={() => onChange(num)}
        className={`cursor-pointer w-14 h-14 rounded-lg border-2 text-xl font-medium transition-all ${
          value === num
            ? "border-current"
            : "border-gray-200 hover:border-gray-300"
        }`}
        style={{
          borderColor: value === num ? brandColor : undefined,
          backgroundColor: value === num ? brandColor : undefined,
          color: value === num ? "white" : "#374151",
        }}
      >
        {num}
      </button>
    ))}
  </div>
);
