"use client";

import type { SectionProps } from "../types";

import { SectionHeader } from "@/components/ui";
import { generateConsentText } from "@/features/informed-consent";

interface PreviewSectionProps extends SectionProps {
  expanded: boolean;
  onToggle: () => void;
}

export const PreviewSection = ({
  settings,
  expanded,
  onToggle,
}: PreviewSectionProps) => (
  <div className="border-t border-gray-100 pt-2">
    <SectionHeader
      title="Preview Generated Text"
      section="preview"
      expanded={expanded}
      onToggle={onToggle}
    />
    {expanded && (
      <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-obsidian-muted max-h-64 overflow-y-auto whitespace-pre-wrap">
        {generateConsentText(settings)}
      </div>
    )}
  </div>
);
