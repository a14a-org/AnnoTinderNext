"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  section: string;
  expanded: boolean;
  onToggle: (section: string) => void;
}

export const SectionHeader = ({
  title,
  section,
  expanded,
  onToggle,
}: SectionHeaderProps) => (
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
