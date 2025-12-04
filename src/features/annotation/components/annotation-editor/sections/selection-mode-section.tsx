"use client";

import type { SelectionMode } from "@/features/annotation";
import type { SectionProps } from "../types";

import { SectionHeader, Input } from "@/components/ui";

interface SelectionModeSectionProps extends SectionProps {
  expanded: boolean;
  onToggle: () => void;
}

export const SelectionModeSection = ({
  settings,
  updateSetting,
  expanded,
  onToggle,
}: SelectionModeSectionProps) => (
  <div className="border-t border-gray-100 pt-2">
    <SectionHeader title="Selection Mode" section="selection" expanded={expanded} onToggle={onToggle} />
    {expanded && (
      <div className="space-y-3 mt-2">
        <div>
          <label className="block text-xs font-medium text-obsidian-muted mb-1">Selection Type</label>
          <select
            value={settings.selectionMode}
            onChange={(e) => updateSetting("selectionMode", e.target.value as SelectionMode)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-chili-coral text-sm"
          >
            <option value="sentence">Sentence Selection</option>
            <option value="word">Word Selection</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {settings.selectionMode === "sentence"
              ? "Users can click to select entire sentences"
              : "Users can click to select individual words"}
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-obsidian-muted mb-1">Highlight Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={settings.highlightColor}
              onChange={(e) => updateSetting("highlightColor", e.target.value)}
              className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
            />
            <Input
              value={settings.highlightColor}
              onChange={(e) => updateSetting("highlightColor", e.target.value)}
              placeholder="#fef08a"
              className="flex-1"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-obsidian-muted mb-1">Instruction Text</label>
          <Input
            value={settings.instructionText}
            onChange={(e) => updateSetting("instructionText", e.target.value)}
            placeholder="Selecteer een passage in de tekst hieronder"
          />
        </div>
      </div>
    )}
  </div>
);
