"use client";

import { Plus } from "lucide-react";

import { questionTypes } from "../constants";

interface AddQuestionMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onAddQuestion: (type: string) => void;
}

export const AddQuestionMenu = ({
  isOpen,
  onToggle,
  onAddQuestion,
}: AddQuestionMenuProps) => (
  <div className="relative">
    <button
      onClick={onToggle}
      className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-obsidian-muted hover:border-chili-coral hover:text-chili-coral transition-colors flex items-center justify-center gap-2"
    >
      <Plus className="w-5 h-5" />
      Add Question
    </button>
    {isOpen && (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-2 z-10 grid grid-cols-2 gap-1">
        {questionTypes.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            onClick={() => onAddQuestion(type)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-obsidian"
          >
            <Icon className="w-4 h-4 text-gray-400" />
            {label}
          </button>
        ))}
      </div>
    )}
  </div>
);
