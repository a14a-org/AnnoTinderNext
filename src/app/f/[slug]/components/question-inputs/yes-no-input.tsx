"use client";

import type { AnswerValue } from "../../types";

interface YesNoInputProps {
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  brandColor: string;
}

export const YesNoInput = ({
  value,
  onChange,
  brandColor,
}: YesNoInputProps) => (
  <div className="flex gap-4">
    <button
      onClick={() => onChange(true)}
      className={`flex-1 p-4 rounded-lg border-2 text-lg font-medium transition-all flex items-center justify-center gap-2 ${
        value === true
          ? "border-current"
          : "border-gray-200 hover:border-gray-300"
      }`}
      style={{
        borderColor: value === true ? brandColor : undefined,
        backgroundColor: value === true ? brandColor : undefined,
        color: value === true ? "white" : "#374151",
      }}
    >
      <span
        className="w-6 h-6 rounded border-2 flex items-center justify-center text-xs"
        style={{
          borderColor: value === true ? "white" : "#D1D5DB",
        }}
      >
        Y
      </span>
      Yes
    </button>
    <button
      onClick={() => onChange(false)}
      className={`flex-1 p-4 rounded-lg border-2 text-lg font-medium transition-all flex items-center justify-center gap-2 ${
        value === false
          ? "border-current"
          : "border-gray-200 hover:border-gray-300"
      }`}
      style={{
        borderColor: value === false ? brandColor : undefined,
        backgroundColor: value === false ? brandColor : undefined,
        color: value === false ? "white" : "#374151",
      }}
    >
      <span
        className="w-6 h-6 rounded border-2 flex items-center justify-center text-xs"
        style={{
          borderColor: value === false ? "white" : "#D1D5DB",
        }}
      >
        N
      </span>
      No
    </button>
  </div>
);
