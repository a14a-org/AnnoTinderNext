"use client";

import type { AnnotationEditorProps } from "./types";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { useAnnotationSettings } from "./hooks/use-annotation-settings";
import {
  TextSourceSection,
  SelectionModeSection,
  FollowUpSection,
  DisplayOptionsSection,
} from "./sections";

type SectionKey = "texts" | "selection" | "followup" | "display";

export const AnnotationEditor = ({
  settings: initialSettings,
  onUpdate,
  articleCount = 0,
  articlesPerSession = 20,
}: AnnotationEditorProps) => {
  const { settings, setSettings, saveStatus, updateSetting } = useAnnotationSettings(
    initialSettings,
    onUpdate
  );

  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    texts: true,
    selection: false,
    followup: false,
    display: false,
  });

  const toggleSection = (section: SectionKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const renderSaveStatus = () => {
    if (saveStatus === "saving") {
      return (
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <Loader2 className="w-3 h-3 animate-spin" />
          Saving...
        </span>
      );
    }
    if (saveStatus === "saved") {
      return (
        <span className="flex items-center gap-1 text-xs text-green-600">
          <Check className="w-3 h-3" />
          Saved
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-obsidian">Annotation Settings</h3>
        {renderSaveStatus()}
      </div>

      <TextSourceSection
        settings={settings}
        updateSetting={updateSetting}
        articleCount={articleCount}
        articlesPerSession={articlesPerSession}
        expanded={expandedSections.texts}
        onToggle={() => toggleSection("texts")}
        setSettings={setSettings}
      />

      <SelectionModeSection
        settings={settings}
        updateSetting={updateSetting}
        expanded={expandedSections.selection}
        onToggle={() => toggleSection("selection")}
      />

      <FollowUpSection
        settings={settings}
        expanded={expandedSections.followup}
        onToggle={() => toggleSection("followup")}
        setSettings={setSettings}
      />

      <DisplayOptionsSection
        settings={settings}
        updateSetting={updateSetting}
        expanded={expandedSections.display}
        onToggle={() => toggleSection("display")}
      />
    </div>
  );
};

export type { AnnotationEditorProps } from "./types";
