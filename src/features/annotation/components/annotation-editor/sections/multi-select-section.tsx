"use client";

import type { MultiSelectMode } from "@/features/annotation";
import type { SectionProps } from "../types";

import { SectionHeader, Input } from "@/components/ui";

interface MultiSelectSectionProps extends SectionProps {
  expanded: boolean;
  onToggle: () => void;
}

export const MultiSelectSection = ({
  settings,
  updateSetting,
  expanded,
  onToggle,
}: MultiSelectSectionProps) => (
  <div className="border-t border-gray-100 pt-2">
    <SectionHeader title="Multi-Selection Settings" section="multiselect" expanded={expanded} onToggle={onToggle} />
    {expanded && (
      <div className="space-y-4 mt-2">
        {/* Multi-select mode */}
        <div>
          <label className="block text-xs font-medium text-obsidian-muted mb-1">Selection Mode</label>
          <select
            value={settings.multiSelectMode ?? "per-selection"}
            onChange={(e) => updateSetting("multiSelectMode", e.target.value as MultiSelectMode)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-chili-coral text-sm"
          >
            <option value="per-selection">Per Selection (answer after each selection)</option>
            <option value="batch">Batch (answer all at once)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {settings.multiSelectMode === "batch"
              ? "Users select multiple sentences, then answer one set of follow-up questions for all."
              : "Users answer follow-up questions immediately after each selection, then can add more."}
          </p>
        </div>

        {/* Max selections per article */}
        <div>
          <label className="block text-xs font-medium text-obsidian-muted mb-1">
            Maximum Selections per Article
          </label>
          <Input
            type="number"
            min="1"
            max="50"
            value={settings.maxSelectionsPerArticle ?? 10}
            onChange={(e) => updateSetting("maxSelectionsPerArticle", parseInt(e.target.value) || 10)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Maximum number of sentences/words a user can select per article.
          </p>
        </div>

        {/* Min selections per article */}
        <div>
          <label className="block text-xs font-medium text-obsidian-muted mb-1">
            Minimum Selections per Article
          </label>
          <Input
            type="number"
            min="0"
            max="10"
            value={settings.minSelectionsPerArticle ?? 1}
            onChange={(e) => updateSetting("minSelectionsPerArticle", parseInt(e.target.value) || 0)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Minimum required selections. Set to 0 to allow &quot;Nothing found&quot; option.
          </p>
        </div>

        {/* Nothing found section */}
        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-sm font-medium text-obsidian mb-3">&quot;Nothing Found&quot; Option</h4>

          <div>
            <label className="block text-xs font-medium text-obsidian-muted mb-1">
              Button Text
            </label>
            <Input
              value={settings.nothingFoundButtonText ?? "Ik vind geen schadelijke zin in dit artikel"}
              onChange={(e) => updateSetting("nothingFoundButtonText", e.target.value)}
              placeholder="Ik vind geen schadelijke zin in dit artikel"
            />
            <p className="text-xs text-gray-500 mt-1">
              Text shown on the &quot;nothing found&quot; button when no selections are made.
            </p>
          </div>

          <div className="mt-3">
            <label className="block text-xs font-medium text-obsidian-muted mb-1">
              Maximum Uses per Session
            </label>
            <Input
              type="number"
              min="0"
              max="100"
              value={settings.maxNothingFoundPerSession ?? 2}
              onChange={(e) => updateSetting("maxNothingFoundPerSession", parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Limit how often users can use &quot;nothing found&quot; per session. Set to 0 for unlimited.
            </p>
          </div>
        </div>
      </div>
    )}
  </div>
);
