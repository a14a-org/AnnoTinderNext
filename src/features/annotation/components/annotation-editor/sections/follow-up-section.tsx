"use client";

import type { TextAnnotationSettings, FollowUpQuestion, FollowUpType } from "@/features/annotation";

import { Plus, Trash2 } from "lucide-react";

import { SectionHeader, Input } from "@/components/ui";

interface FollowUpSectionProps {
  settings: TextAnnotationSettings;
  expanded: boolean;
  onToggle: () => void;
  setSettings: React.Dispatch<React.SetStateAction<TextAnnotationSettings>>;
}

export const FollowUpSection = ({
  settings,
  expanded,
  onToggle,
  setSettings,
}: FollowUpSectionProps) => {
  const addFollowUpQuestion = () => {
    const newQuestion: FollowUpQuestion = {
      id: `q-${Date.now()}`,
      type: "multiple_choice",
      question: "",
      isRequired: true,
      options: [{ label: "", value: "" }],
      placeholder: undefined,
      minRating: undefined,
      maxRating: undefined,
      minLabel: undefined,
      maxLabel: undefined,
      minWords: undefined,
    };
    setSettings((prev) => ({
      ...prev,
      followUpQuestions: [...(prev.followUpQuestions || []), newQuestion],
    }));
  };

  const updateFollowUpQuestion = (questionIndex: number, updates: Partial<FollowUpQuestion>) => {
    setSettings((prev) => ({
      ...prev,
      followUpQuestions: (prev.followUpQuestions || []).map((q, i) =>
        i === questionIndex ? { ...q, ...updates } : q
      ),
    }));
  };

  const removeFollowUpQuestion = (questionIndex: number) => {
    setSettings((prev) => ({
      ...prev,
      followUpQuestions: (prev.followUpQuestions || []).filter((_, i) => i !== questionIndex),
    }));
  };

  const addOptionToQuestion = (questionIndex: number) => {
    setSettings((prev) => ({
      ...prev,
      followUpQuestions: (prev.followUpQuestions || []).map((q, i) =>
        i === questionIndex ? { ...q, options: [...(q.options || []), { label: "", value: "" }] } : q
      ),
    }));
  };

  const updateQuestionOption = (questionIndex: number, optionIndex: number, label: string) => {
    setSettings((prev) => ({
      ...prev,
      followUpQuestions: (prev.followUpQuestions || []).map((q, i) =>
        i === questionIndex
          ? { ...q, options: (q.options || []).map((opt, oi) => (oi === optionIndex ? { label, value: label } : opt)) }
          : q
      ),
    }));
  };

  const removeQuestionOption = (questionIndex: number, optionIndex: number) => {
    setSettings((prev) => ({
      ...prev,
      followUpQuestions: (prev.followUpQuestions || []).map((q, i) =>
        i === questionIndex ? { ...q, options: (q.options || []).filter((_, oi) => oi !== optionIndex) } : q
      ),
    }));
  };

  return (
    <div className="border-t border-gray-100 pt-2">
      <SectionHeader
        title={`Follow-up Questions (${(settings.followUpQuestions || []).length})`}
        section="followup"
        expanded={expanded}
        onToggle={onToggle}
      />
      {expanded && (
        <div className="space-y-4 mt-2">
          <p className="text-xs text-gray-500">Questions shown after text selection. Add multiple questions of different types.</p>

          {(settings.followUpQuestions || []).map((question, qIndex) => (
            <div key={question.id} className="p-3 border border-gray-200 rounded-lg space-y-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-obsidian-muted">Question {qIndex + 1}</span>
                <button type="button" onClick={() => removeFollowUpQuestion(qIndex)} className="p-1 hover:bg-gray-200 rounded text-gray-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-obsidian-muted mb-1">Type</label>
                  <select
                    value={question.type}
                    onChange={(e) => updateFollowUpQuestion(qIndex, { type: e.target.value as FollowUpType })}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-chili-coral text-sm"
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="open_text">Open Text</option>
                    <option value="rating_scale">Rating Scale (1-5)</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm text-obsidian">
                    <input
                      type="checkbox"
                      checked={question.isRequired}
                      onChange={(e) => updateFollowUpQuestion(qIndex, { isRequired: e.target.checked })}
                      className="w-4 h-4 text-chili-coral border-gray-300 rounded focus:ring-chili-coral"
                    />
                    Required
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-obsidian-muted mb-1">Question</label>
                <Input
                  value={question.question}
                  onChange={(e) => updateFollowUpQuestion(qIndex, { question: e.target.value })}
                  placeholder="Enter your question..."
                />
              </div>

              {question.type === "multiple_choice" && (
                <div>
                  <label className="block text-xs font-medium text-obsidian-muted mb-1">Options</label>
                  <div className="space-y-2">
                    {(question.options || []).map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <Input
                          value={option.label}
                          onChange={(e) => updateQuestionOption(qIndex, oIndex, e.target.value)}
                          placeholder={`Option ${oIndex + 1}`}
                          className="flex-1"
                        />
                        <button type="button" onClick={() => removeQuestionOption(qIndex, oIndex)} className="p-1 hover:bg-gray-200 rounded text-gray-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addOptionToQuestion(qIndex)} className="text-xs text-chili-coral hover:underline flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add option
                    </button>
                  </div>
                </div>
              )}

              {question.type === "open_text" && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-obsidian-muted mb-1">Placeholder</label>
                    <Input
                      value={question.placeholder || ""}
                      onChange={(e) => updateFollowUpQuestion(qIndex, { placeholder: e.target.value })}
                      placeholder="Type your answer here..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-obsidian-muted mb-1">Minimum words (0 = no minimum)</label>
                    <Input
                      type="number"
                      min={0}
                      value={question.minWords ?? 0}
                      onChange={(e) => updateFollowUpQuestion(qIndex, { minWords: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                </div>
              )}

              {question.type === "rating_scale" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-obsidian-muted mb-1">Min Label (1)</label>
                    <Input
                      value={question.minLabel || ""}
                      onChange={(e) => updateFollowUpQuestion(qIndex, { minLabel: e.target.value })}
                      placeholder="e.g., Not at all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-obsidian-muted mb-1">Max Label (5)</label>
                    <Input
                      value={question.maxLabel || ""}
                      onChange={(e) => updateFollowUpQuestion(qIndex, { maxLabel: e.target.value })}
                      placeholder="e.g., Very much"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addFollowUpQuestion}
            className="w-full py-2 text-xs text-chili-coral hover:bg-chili-coral/5 rounded-lg border border-dashed border-chili-coral/30 transition-colors flex items-center justify-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add follow-up question
          </button>
        </div>
      )}
    </div>
  );
};
