"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/atoms/Input";
import { Loader2, Check, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import {
  InformedConsentSettings,
  DEFAULT_CONSENT_SETTINGS,
  generateConsentText,
} from "@/lib/informed-consent";

interface InformedConsentEditorProps {
  settings: InformedConsentSettings | null;
  onUpdate: (settings: InformedConsentSettings) => void;
}

// Section header component defined outside to avoid recreation during render
function SectionHeader({
  title,
  section,
  expanded,
  onToggle,
}: {
  title: string;
  section: string;
  expanded: boolean;
  onToggle: (section: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(section)}
      className="flex items-center justify-between w-full py-2 text-sm font-semibold text-obsidian hover:text-chili-coral transition-colors"
    >
      {title}
      {expanded ? (
        <ChevronUp className="w-4 h-4" />
      ) : (
        <ChevronDown className="w-4 h-4" />
      )}
    </button>
  );
}

export function InformedConsentEditor({
  settings: initialSettings,
  onUpdate,
}: InformedConsentEditorProps) {
  // Merge initial settings with defaults to ensure all fields exist
  const [settings, setSettings] = useState<InformedConsentSettings>(() => ({
    ...DEFAULT_CONSENT_SETTINGS,
    ...(initialSettings || {}),
    // Ensure arrays are properly initialized
    researchers: initialSettings?.researchers?.length ? initialSettings.researchers : DEFAULT_CONSENT_SETTINGS.researchers,
    dataCollected: initialSettings?.dataCollected?.length ? initialSettings.dataCollected : DEFAULT_CONSENT_SETTINGS.dataCollected,
  }));
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    research: true,
    procedure: false,
    data: false,
    buttons: false,
    preview: false,
  });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      initialLoadRef.current = false;
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (initialLoadRef.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus("saving");
      onUpdate(settings);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [settings, onUpdate]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateSetting = <K extends keyof InformedConsentSettings>(
    key: K,
    value: InformedConsentSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const addResearcher = () => {
    setSettings((prev) => ({
      ...prev,
      researchers: [...prev.researchers, ""],
    }));
  };

  const removeResearcher = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      researchers: prev.researchers.filter((_, i) => i !== index),
    }));
  };

  const updateResearcher = (index: number, value: string) => {
    setSettings((prev) => ({
      ...prev,
      researchers: prev.researchers.map((r, i) => (i === index ? value : r)),
    }));
  };

  const addDataItem = () => {
    setSettings((prev) => ({
      ...prev,
      dataCollected: [...prev.dataCollected, ""],
    }));
  };

  const removeDataItem = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      dataCollected: prev.dataCollected.filter((_, i) => i !== index),
    }));
  };

  const updateDataItem = (index: number, value: string) => {
    setSettings((prev) => ({
      ...prev,
      dataCollected: prev.dataCollected.map((d, i) => (i === index ? value : d)),
    }));
  };

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-obsidian">Consent Settings</h3>
        {saveStatus === "saving" && (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Loader2 className="w-3 h-3 animate-spin" />
            Saving...
          </span>
        )}
        {saveStatus === "saved" && (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <Check className="w-3 h-3" />
            Saved
          </span>
        )}
      </div>

      {/* Research Details */}
      <div className="border-t border-gray-100 pt-2">
        <SectionHeader
          title="Research Details"
          section="research"
          expanded={expandedSections.research}
          onToggle={toggleSection}
        />
        {expandedSections.research && (
          <div className="space-y-3 mt-2">
            <div>
              <label className="block text-xs font-medium text-obsidian-muted mb-1">
                Research Title
              </label>
              <Input
                value={settings.researchTitle}
                onChange={(e) => updateSetting("researchTitle", e.target.value)}
                placeholder="Onderzoekstitel"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-obsidian-muted mb-1">
                Researchers / Organizations
              </label>
              <div className="space-y-2">
                {settings.researchers.map((researcher, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={researcher}
                      onChange={(e) => updateResearcher(index, e.target.value)}
                      placeholder="e.g., Universiteit van Amsterdam"
                      className="flex-1"
                    />
                    {settings.researchers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeResearcher(index)}
                        className="p-1 hover:bg-gray-100 rounded text-gray-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addResearcher}
                  className="text-xs text-chili-coral hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add researcher
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-obsidian-muted mb-1">
                Contact Person
              </label>
              <Input
                value={settings.contactPerson}
                onChange={(e) => updateSetting("contactPerson", e.target.value)}
                placeholder="Name of contact person"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-obsidian-muted mb-1">
                Contact Email
              </label>
              <Input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => updateSetting("contactEmail", e.target.value)}
                placeholder="onderzoek@voorbeeld.nl"
              />
            </div>
          </div>
        )}
      </div>

      {/* Procedure */}
      <div className="border-t border-gray-100 pt-2">
        <SectionHeader
          title="Procedure"
          section="procedure"
          expanded={expandedSections.procedure}
          onToggle={toggleSection}
        />
        {expandedSections.procedure && (
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

      {/* Data Handling */}
      <div className="border-t border-gray-100 pt-2">
        <SectionHeader
          title="Data Handling"
          section="data"
          expanded={expandedSections.data}
          onToggle={toggleSection}
        />
        {expandedSections.data && (
          <div className="space-y-3 mt-2">
            <div>
              <label className="block text-xs font-medium text-obsidian-muted mb-1">
                Data Collected
              </label>
              <div className="space-y-2">
                {settings.dataCollected.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={item}
                      onChange={(e) => updateDataItem(index, e.target.value)}
                      placeholder="e.g., leeftijd"
                      className="flex-1"
                    />
                    {settings.dataCollected.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDataItem(index)}
                        className="p-1 hover:bg-gray-100 rounded text-gray-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addDataItem}
                  className="text-xs text-chili-coral hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add data type
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-obsidian-muted mb-1">
                Data Processor
              </label>
              <Input
                value={settings.dataProcessor}
                onChange={(e) => updateSetting("dataProcessor", e.target.value)}
                placeholder="Who processes the data"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-obsidian-muted mb-1">
                Retention Period
              </label>
              <Input
                value={settings.dataRetentionPeriod}
                onChange={(e) => updateSetting("dataRetentionPeriod", e.target.value)}
                placeholder="e.g., 10 jaar"
              />
            </div>
          </div>
        )}
      </div>

      {/* Button Text */}
      <div className="border-t border-gray-100 pt-2">
        <SectionHeader
          title="Button Text & Decline"
          section="buttons"
          expanded={expandedSections.buttons}
          onToggle={toggleSection}
        />
        {expandedSections.buttons && (
          <div className="space-y-3 mt-2">
            <div>
              <label className="block text-xs font-medium text-obsidian-muted mb-1">
                Agree Button Text
              </label>
              <Input
                value={settings.agreeButtonText || ""}
                onChange={(e) => updateSetting("agreeButtonText", e.target.value)}
                placeholder={DEFAULT_CONSENT_SETTINGS.agreeButtonText}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-obsidian-muted mb-1">
                Decline Button Text
              </label>
              <Input
                value={settings.declineButtonText || ""}
                onChange={(e) => updateSetting("declineButtonText", e.target.value)}
                placeholder={DEFAULT_CONSENT_SETTINGS.declineButtonText}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-obsidian-muted mb-1">
                Decline Screen Title
              </label>
              <Input
                value={settings.declineTitle || ""}
                onChange={(e) => updateSetting("declineTitle", e.target.value)}
                placeholder={DEFAULT_CONSENT_SETTINGS.declineTitle}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-obsidian-muted mb-1">
                Decline Screen Message
              </label>
              <textarea
                value={settings.declineMessage || ""}
                onChange={(e) => updateSetting("declineMessage", e.target.value)}
                placeholder={DEFAULT_CONSENT_SETTINGS.declineMessage}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-chili-coral text-sm"
                rows={3}
              />
            </div>
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="border-t border-gray-100 pt-2">
        <SectionHeader
          title="Preview Generated Text"
          section="preview"
          expanded={expandedSections.preview}
          onToggle={toggleSection}
        />
        {expandedSections.preview && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-obsidian-muted max-h-64 overflow-y-auto whitespace-pre-wrap">
            {generateConsentText(settings)}
          </div>
        )}
      </div>
    </div>
  );
}
