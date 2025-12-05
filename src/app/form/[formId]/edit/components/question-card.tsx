"use client";

import type { Question } from "../types";

import { Reorder } from "framer-motion";
import { GripVertical, Type } from "lucide-react";

import { questionTypes, isChoiceType } from "../constants";

interface QuestionCardProps {
  question: Question;
  index: number;
  isSelected: boolean;
  hasError?: boolean;
  onSelect: () => void;
}

export const QuestionCard = ({
  question,
  index,
  isSelected,
  hasError,
  onSelect,
}: QuestionCardProps) => {
  const typeConfig = questionTypes.find((t) => t.type === question.type);
  const Icon = typeConfig?.icon || Type;

  return (
    <Reorder.Item
      value={question}
      className={`bg-white rounded-xl border-2 p-6 cursor-grab active:cursor-grabbing transition-colors ${
        isSelected
          ? "border-chili-coral"
          : hasError
          ? "border-amber-300 bg-amber-50/30"
          : "border-gray-200 hover:border-gray-300"
      }`}
      onClick={onSelect}
      whileDrag={{
        scale: 1.02,
        boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2 text-gray-400 mt-1">
          <GripVertical className="w-4 h-4" />
          <span className="text-sm font-medium">{index + 1}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-obsidian-muted mb-2">
            <Icon className="w-4 h-4" />
            {typeConfig?.label || question.type}
            {question.isRequired && (
              <span className="text-red-500">*</span>
            )}
          </div>
          <h3 className={`font-medium ${question.title ? "text-obsidian" : "text-obsidian-muted/60 italic"}`}>
            {question.title || "Question title"}
          </h3>
          {question.description && (
            <p className="text-sm text-obsidian-muted mt-1">
              {question.description}
            </p>
          )}
          {isChoiceType(question.type) && question.options.length > 0 && (
            <div className="mt-3 space-y-1">
              {question.options.map((opt) => (
                <div
                  key={opt.id}
                  className="text-sm text-obsidian-muted flex items-center gap-2"
                >
                  <div className="w-4 h-4 border border-gray-300 rounded" />
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Reorder.Item>
  );
};
