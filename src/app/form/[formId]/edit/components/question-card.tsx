"use client";

import { useState, useEffect } from "react";
import type { Question, QuestionUpdatePayload } from "../types";

import { Reorder } from "framer-motion";
import { GripVertical, Type, Plus } from "lucide-react";

import { questionTypes, isChoiceType } from "../constants";

interface QuestionCardProps {
  question: Question;
  index: number;
  isSelected: boolean;
  hasError?: boolean;
  onSelect: () => void;
  onUpdate: (updates: QuestionUpdatePayload) => void;
}

export const QuestionCard = ({
  question,
  index,
  isSelected,
  hasError,
  onSelect,
  onUpdate,
}: QuestionCardProps) => {
  const typeConfig = questionTypes.find((t) => t.type === question.type);
  const Icon = typeConfig?.icon || Type;

  const [title, setTitle] = useState(question.title);
  const [description, setDescription] = useState(question.description || "");
  const [options, setOptions] = useState(question.options || []);

  useEffect(() => {
    setTitle(question.title);
  }, [question.title]);

  useEffect(() => {
    setDescription(question.description || "");
  }, [question.description]);

  useEffect(() => {
    setOptions(question.options || []);
  }, [question.options]);

  return (
    <Reorder.Item
      value={question}
      id={`question-${question.id}`}
      className={`bg-white rounded-xl border-2 p-6 cursor-grab active:cursor-grabbing transition-colors ${
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
          <input
            value={title}
            onChange={(e) => {
              const newTitle = e.target.value;
              setTitle(newTitle);
              onUpdate({ title: newTitle });
            }}
            className={`font-medium w-full bg-transparent border-none p-0 focus:ring-0 focus:outline-none placeholder:text-gray-300 ${
              title ? "text-obsidian" : "text-obsidian-muted/60 italic"
            }`}
            placeholder="Question title"
            onPointerDown={(e) => e.stopPropagation()}
          />
          <textarea
            value={description}
            onChange={(e) => {
              const newDesc = e.target.value;
              setDescription(newDesc);
              onUpdate({ description: newDesc });
            }}
            className="text-sm text-obsidian-muted mt-1 w-full bg-transparent border-none p-0 focus:ring-0 focus:outline-none resize-none placeholder:text-gray-300"
            placeholder="Description (optional)"
            rows={description ? Math.max(2, description.split('\n').length) : 1}
            onPointerDown={(e) => e.stopPropagation()}
          />
          {isChoiceType(question.type) && (
            <div className="mt-3 space-y-1">
              {options.map((opt, index) => (
                <div
                  key={opt.id}
                  className="text-sm text-obsidian-muted flex items-center gap-2"
                >
                  <div className="w-4 h-4 border border-gray-300 rounded shrink-0" />
                  <input
                    value={opt.label}
                    onChange={(e) => {
                      const newLabel = e.target.value;
                      const newOptions = [...options];
                      newOptions[index] = {
                        ...newOptions[index],
                        label: newLabel,
                        value: newLabel,
                      };
                      setOptions(newOptions);
                      onUpdate({
                        options: newOptions.map((o) => ({
                          label: o.label,
                          value: o.value,
                        })),
                      });
                    }}
                    className="w-full bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-obsidian-muted placeholder:text-gray-300"
                    placeholder={`Option ${index + 1}`}
                    onPointerDown={(e) => e.stopPropagation()}
                  />
                </div>
              ))}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newOptions = [
                    ...options,
                    {
                      id: `new-${Date.now()}`,
                      label: `Option ${options.length + 1}`,
                      value: `Option ${options.length + 1}`,
                      displayOrder: options.length,
                    },
                  ];
                  setOptions(newOptions);
                  onUpdate({
                    options: newOptions.map((o) => ({
                      label: o.label,
                      value: o.value,
                    })),
                  });
                }}
                className="flex items-center gap-2 text-sm text-chili-coral hover:text-chili-coral/80 mt-2 px-0.5 py-1 rounded transition-colors hover:bg-chili-coral/5"
              >
                <Plus className="w-4 h-4" />
                Add option
              </button>
            </div>
          )}
        </div>
      </div>
    </Reorder.Item>
  );
};
