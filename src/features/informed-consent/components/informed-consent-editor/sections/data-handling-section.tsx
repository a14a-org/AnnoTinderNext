"use client";

import type { SectionProps } from "../types";

import { Plus, Trash2 } from "lucide-react";

import { Input, SectionHeader } from "@/components/ui";

interface DataHandlingSectionProps extends SectionProps {
  expanded: boolean;
  onToggle: () => void;
  setSettings: React.Dispatch<React.SetStateAction<SectionProps["settings"]>>;
}

export const DataHandlingSection = ({
  settings,
  updateSetting,
  expanded,
  onToggle,
  setSettings,
}: DataHandlingSectionProps) => {
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

  return (
    <div className="border-t border-gray-100 pt-2">
      <SectionHeader
        title="Data Handling"
        section="data"
        expanded={expanded}
        onToggle={onToggle}
      />
      {expanded && (
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
  );
};
