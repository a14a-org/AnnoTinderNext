"use client";

import type { InformedConsentEditorProps, SectionKey } from "./types";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { useConsentSettings } from "./hooks/use-consent-settings";
import {
  ResearchDetailsSection,
  ProcedureSection,
  DataHandlingSection,
  ButtonTextSection,
  PreviewSection,
} from "./sections";

export const InformedConsentEditor = ({
  settings: initialSettings,
  onUpdate,
}: InformedConsentEditorProps) => {
  const { settings, setSettings, saveStatus, updateSetting } = useConsentSettings(
    initialSettings,
    onUpdate
  );

  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    research: true,
    procedure: false,
    data: false,
    buttons: false,
    preview: false,
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
        <h3 className="font-semibold text-obsidian">Consent Settings</h3>
        {renderSaveStatus()}
      </div>

      <ResearchDetailsSection
        settings={settings}
        updateSetting={updateSetting}
        expanded={expandedSections.research}
        onToggle={() => toggleSection("research")}
        setSettings={setSettings}
      />

      <ProcedureSection
        settings={settings}
        updateSetting={updateSetting}
        expanded={expandedSections.procedure}
        onToggle={() => toggleSection("procedure")}
        setSettings={setSettings}
      />

      <DataHandlingSection
        settings={settings}
        updateSetting={updateSetting}
        expanded={expandedSections.data}
        onToggle={() => toggleSection("data")}
        setSettings={setSettings}
      />

      <ButtonTextSection
        settings={settings}
        updateSetting={updateSetting}
        expanded={expandedSections.buttons}
        onToggle={() => toggleSection("buttons")}
      />

      <PreviewSection
        settings={settings}
        updateSetting={updateSetting}
        expanded={expandedSections.preview}
        onToggle={() => toggleSection("preview")}
      />
    </div>
  );
};

export type { InformedConsentEditorProps } from "./types";
