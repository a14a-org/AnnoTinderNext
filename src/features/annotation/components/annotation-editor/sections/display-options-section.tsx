"use client";

import type { SectionProps } from "../types";

import { SectionHeader, Input } from "@/components/ui";

interface DisplayOptionsSectionProps extends SectionProps {
  expanded: boolean;
  onToggle: () => void;
}

export const DisplayOptionsSection = ({
  settings,
  updateSetting,
  expanded,
  onToggle,
}: DisplayOptionsSectionProps) => (
  <div className="border-t border-gray-100 pt-2">
    <SectionHeader title="Display Options" section="display" expanded={expanded} onToggle={onToggle} />
    {expanded && (
      <div className="space-y-3 mt-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="allowSkip"
            checked={settings.allowSkip}
            onChange={(e) => updateSetting("allowSkip", e.target.checked)}
            className="w-4 h-4 text-chili-coral border-gray-300 rounded focus:ring-chili-coral"
          />
          <label htmlFor="allowSkip" className="text-sm text-obsidian">
            Allow users to skip texts
          </label>
        </div>

        {settings.allowSkip && (
          <div>
            <label className="block text-xs font-medium text-obsidian-muted mb-1">Skip Button Text</label>
            <Input
              value={settings.skipButtonText}
              onChange={(e) => updateSetting("skipButtonText", e.target.value)}
              placeholder="Overslaan"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-obsidian-muted mb-1">
            Highlight Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={settings.highlightColor}
              onChange={(e) => updateSetting("highlightColor", e.target.value)}
              className="w-9 h-9 p-0.5 rounded cursor-pointer border border-gray-200"
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
          <label className="block text-xs font-medium text-obsidian-muted mb-1">
            Minimum time on page (seconds)
          </label>
          <Input
            type="number"
            min="0"
            value={settings.minimumTimeOnPage ?? 5}
            onChange={(e) => updateSetting("minimumTimeOnPage", parseInt(e.target.value) || 0)}
          />
          <p className="text-xs text-obsidian-muted mt-1">
            Prevents skipping or submitting until this time has passed.
          </p>
        </div>
      </div>
    )}
  </div>
);
