"use client";

import type { DemographicField, DemographicsSettings } from "@/features/demographics";

import { useState } from "react";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";

import { Input, SectionHeader } from "@/components/ui";
import { useAutoSave } from "@/hooks";
import { DEFAULT_DEMOGRAPHICS_SETTINGS } from "@/features/demographics";

interface DemographicsEditorProps {
  settings: DemographicsSettings | null;
  onUpdate: (settings: DemographicsSettings) => void;
}

export const DemographicsEditor = ({
  settings: initialSettings,
  onUpdate,
}: DemographicsEditorProps) => {
  const [settings, setSettings] = useState<DemographicsSettings>(() => ({
    ...DEFAULT_DEMOGRAPHICS_SETTINGS,
    ...(initialSettings || {}),
    fields: initialSettings?.fields?.length
      ? initialSettings.fields
      : DEFAULT_DEMOGRAPHICS_SETTINGS.fields,
    caucasianEthnicities: initialSettings?.caucasianEthnicities?.length
      ? initialSettings.caucasianEthnicities
      : DEFAULT_DEMOGRAPHICS_SETTINGS.caucasianEthnicities,
  }));

  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    fields: true,
    classification: false,
  });

  const { saveStatus } = useAutoSave({ value: settings, onSave: onUpdate });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateField = (index: number, updates: Partial<DemographicField>) => {
    setSettings((prev) => ({
      ...prev,
      fields: prev.fields.map((f, i) =>
        i === index ? { ...f, ...updates } : f
      ),
    }));
  };

  const addFieldOption = (fieldIndex: number) => {
    setSettings((prev) => ({
      ...prev,
      fields: prev.fields.map((f, i) =>
        i === fieldIndex
          ? { ...f, options: [...(f.options || []), "New option"] }
          : f
      ),
    }));
  };

  const updateFieldOption = (
    fieldIndex: number,
    optionIndex: number,
    value: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      fields: prev.fields.map((f, i) =>
        i === fieldIndex
          ? {
              ...f,
              options: f.options?.map((o, oi) =>
                oi === optionIndex ? value : o
              ),
            }
          : f
      ),
    }));
  };

  const removeFieldOption = (fieldIndex: number, optionIndex: number) => {
    setSettings((prev) => ({
      ...prev,
      fields: prev.fields.map((f, i) =>
        i === fieldIndex
          ? {
              ...f,
              options: f.options?.filter((_, oi) => oi !== optionIndex),
            }
          : f
      ),
    }));
  };

  const addCaucasianEthnicity = () => {
    setSettings((prev) => ({
      ...prev,
      caucasianEthnicities: [...prev.caucasianEthnicities, ""],
    }));
  };

  const updateCaucasianEthnicity = (index: number, value: string) => {
    setSettings((prev) => ({
      ...prev,
      caucasianEthnicities: prev.caucasianEthnicities.map((e, i) =>
        i === index ? value : e
      ),
    }));
  };

  const removeCaucasianEthnicity = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      caucasianEthnicities: prev.caucasianEthnicities.filter(
        (_, i) => i !== index
      ),
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-obsidian">Demographics Settings</h3>
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

      {/* Fields Section */}
      <div className="border-t border-gray-100 pt-2">
        <SectionHeader
          title={`Questions (${settings.fields.length})`}
          section="fields"
          expanded={expandedSections.fields}
          onToggle={toggleSection}
        />
        {expandedSections.fields && (
          <div className="space-y-4 mt-2">
            {settings.fields.map((field, fieldIndex) => (
              <div
                key={field.id}
                className="p-3 bg-gray-50 rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    {field.id}
                  </span>
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) =>
                        updateField(fieldIndex, { required: e.target.checked })
                      }
                      className="w-3 h-3"
                    />
                    Required
                  </label>
                </div>

                <Input
                  value={field.label}
                  onChange={(e) =>
                    updateField(fieldIndex, { label: e.target.value })
                  }
                  placeholder="Question label"
                  className="text-sm"
                />

                {field.type === "single_choice" && field.options && (
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Options:</label>
                    {field.options.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className="flex items-center gap-1"
                      >
                        <Input
                          value={option}
                          onChange={(e) =>
                            updateFieldOption(
                              fieldIndex,
                              optionIndex,
                              e.target.value
                            )
                          }
                          className="flex-1 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            removeFieldOption(fieldIndex, optionIndex)
                          }
                          className="p-1 hover:bg-gray-200 rounded text-gray-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addFieldOption(fieldIndex)}
                      className="text-xs text-chili-coral hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add option
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Classification Section */}
      <div className="border-t border-gray-100 pt-2">
        <SectionHeader
          title="Demographic Classification"
          section="classification"
          expanded={expandedSections.classification}
          onToggle={toggleSection}
        />
        {expandedSections.classification && (
          <div className="space-y-3 mt-2">
            <p className="text-xs text-gray-500">
              Ethnicities classified as &quot;Caucasian/Dutch&quot; for quota purposes.
              All other ethnicities are classified as &quot;Minority&quot;.
            </p>
            <div className="space-y-2">
              {settings.caucasianEthnicities.map((ethnicity, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={ethnicity}
                    onChange={(e) =>
                      updateCaucasianEthnicity(index, e.target.value)
                    }
                    placeholder="Ethnicity name"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeCaucasianEthnicity(index)}
                    className="p-1 hover:bg-gray-100 rounded text-gray-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addCaucasianEthnicity}
                className="text-xs text-chili-coral hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add ethnicity
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
