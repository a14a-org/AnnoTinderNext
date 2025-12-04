"use client";

import type { SectionProps } from "../types";

import { Plus, Trash2 } from "lucide-react";

import { Input, SectionHeader } from "@/components/ui";

interface ProcedureSectionProps extends SectionProps {
  expanded: boolean;
  onToggle: () => void;
  setSettings: React.Dispatch<React.SetStateAction<SectionProps["settings"]>>;
}

export const ProcedureSection = ({
  settings,
  updateSetting,
  expanded,
  onToggle,
  setSettings,
}: ProcedureSectionProps) => {
  const addContentWarning = () => {
    setSettings((prev) => ({
      ...prev,
      contentWarnings: [...(prev.contentWarnings || []), ""],
    }));
  };

  const removeContentWarning = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      contentWarnings: prev.contentWarnings?.filter((_, i) => i !== index),
    }));
  };

  const updateContentWarning = (index: number, value: string) => {
    setSettings((prev) => ({
      ...prev,
      contentWarnings: prev.contentWarnings?.map((w, i) => (i === index ? value : w)),
    }));
  };

  return (
    <div className="border-t border-gray-100 pt-2">
      <SectionHeader
        title="Procedure"
        section="procedure"
        expanded={expanded}
        onToggle={onToggle}
      />
      {expanded && (
        <div className="space-y-3 mt-2">
          <div>
            <label className="block text-xs font-medium text-obsidian-muted mb-1">
              Estimated Duration
            </label>
            <Input
              value={settings.estimatedDuration}
              onChange={(e) => updateSetting("estimatedDuration", e.target.value)}
              placeholder="e.g., 15 minuten"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-obsidian-muted mb-1">
              Compensation (optional)
            </label>
            <Input
              value={settings.compensation || ""}
              onChange={(e) => updateSetting("compensation", e.target.value || undefined)}
              placeholder="e.g., €10 cadeaubon"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-obsidian-muted mb-1">
              Minimum Age
            </label>
            <Input
              type="number"
              value={settings.minimumAge}
              onChange={(e) => updateSetting("minimumAge", parseInt(e.target.value) || 16)}
              min={0}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-obsidian-muted mb-1">
              Content Warnings (optional)
            </label>
            <div className="space-y-2">
              {(settings.contentWarnings || []).map((warning, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={warning}
                    onChange={(e) => updateContentWarning(index, e.target.value)}
                    placeholder="e.g., disturbing content"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeContentWarning(index)}
                    className="p-1 hover:bg-gray-100 rounded text-gray-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addContentWarning}
                className="text-xs text-chili-coral hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add warning
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
