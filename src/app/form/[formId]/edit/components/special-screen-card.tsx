"use client";

import { useState, useEffect, useRef } from "react";
import type { Question, QuestionUpdatePayload } from "../types";
import type { LucideIcon } from "lucide-react";

interface SpecialScreenCardProps {
  question: Question;
  icon: LucideIcon;
  label: string;
  isSelected: boolean;
  hasError?: boolean;
  onSelect: () => void;
  onUpdate: (updates: QuestionUpdatePayload) => void;
}

export const SpecialScreenCard = ({
  question,
  icon: Icon,
  label,
  isSelected,
  hasError,
  onSelect,
  onUpdate,
}: SpecialScreenCardProps) => {
  const [title, setTitle] = useState(question.title);
  const [description, setDescription] = useState(question.description || "");

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(question.title);
  }, [question.title]);

  useEffect(() => {
    setDescription(question.description || "");
  }, [question.description]);

  // Auto-focus logic
  useEffect(() => {
    if (isSelected && hasError) {
      if (!title || title.trim() === "") {
        titleInputRef.current?.focus();
      }
    }
  }, [isSelected, hasError]);

  return (
    <div
      className={`bg-white rounded-xl border-2 p-6 cursor-pointer transition-colors ${
        isSelected
          ? "border-chili-coral"
          : hasError
          ? "border-amber-300 bg-amber-50/30"
          : "border-gray-200 hover:border-gray-300"
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <div className="flex items-center gap-2 text-sm text-obsidian-muted mb-2">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <input
        ref={titleInputRef}
        value={title}
        onFocus={onSelect}
        onChange={(e) => {
          const newTitle = e.target.value;
          setTitle(newTitle);
          onUpdate({ title: newTitle });
        }}
        className="font-semibold text-obsidian w-full bg-transparent border-none p-0 focus:ring-0 focus:outline-none placeholder:text-gray-300"
        placeholder="Screen Title"
      />
      <textarea
        value={description}
        onFocus={onSelect}
        onChange={(e) => {
          const newDesc = e.target.value;
          setDescription(newDesc);
          onUpdate({ description: newDesc });
        }}
        className="text-sm text-obsidian-muted mt-1 w-full bg-transparent border-none p-0 focus:ring-0 focus:outline-none resize-none placeholder:text-gray-300"
        placeholder="Description (optional)"
        rows={description ? Math.max(2, description.split('\n').length) : 1}
      />
    </div>
  );
};
