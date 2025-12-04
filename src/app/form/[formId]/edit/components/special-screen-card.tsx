"use client";

import type { Question } from "../types";
import type { LucideIcon } from "lucide-react";

interface SpecialScreenCardProps {
  question: Question;
  icon: LucideIcon;
  label: string;
  isSelected: boolean;
  onSelect: () => void;
}

export const SpecialScreenCard = ({
  question,
  icon: Icon,
  label,
  isSelected,
  onSelect,
}: SpecialScreenCardProps) => (
  <div
    className={`bg-white rounded-xl border-2 p-6 cursor-pointer transition-colors ${
      isSelected
        ? "border-chili-coral"
        : "border-gray-200 hover:border-gray-300"
    }`}
    onClick={onSelect}
  >
    <div className="flex items-center gap-2 text-sm text-obsidian-muted mb-2">
      <Icon className="w-4 h-4" />
      {label}
    </div>
    <h3 className="font-semibold text-obsidian">
      {question.title}
    </h3>
    {question.description && (
      <p className="text-sm text-obsidian-muted mt-1">
        {question.description}
      </p>
    )}
  </div>
);
