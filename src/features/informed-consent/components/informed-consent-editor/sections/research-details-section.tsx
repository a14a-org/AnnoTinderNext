"use client";

import type { SectionProps } from "../types";

import { Plus, Trash2 } from "lucide-react";

import { Input, SectionHeader } from "@/components/ui";

interface ResearchDetailsSectionProps extends SectionProps {
  expanded: boolean;
  onToggle: () => void;
  setSettings: React.Dispatch<React.SetStateAction<SectionProps["settings"]>>;
}

export const ResearchDetailsSection = ({
  settings,
  updateSetting,
  expanded,
  onToggle,
  setSettings,
}: ResearchDetailsSectionProps) => {
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

  return (
    <div className="border-t border-gray-100 pt-2">
      <SectionHeader
        title="Research Details"
        section="research"
        expanded={expanded}
        onToggle={onToggle}
      />
      {expanded && (
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
  );
};
