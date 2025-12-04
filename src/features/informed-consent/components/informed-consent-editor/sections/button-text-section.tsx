"use client";

import type { SectionProps } from "../types";

import { Input, SectionHeader } from "@/components/ui";
import { DEFAULT_CONSENT_SETTINGS } from "@/features/informed-consent";

interface ButtonTextSectionProps extends SectionProps {
  expanded: boolean;
  onToggle: () => void;
}

export const ButtonTextSection = ({
  settings,
  updateSetting,
  expanded,
  onToggle,
}: ButtonTextSectionProps) => (
  <div className="border-t border-gray-100 pt-2">
    <SectionHeader
      title="Button Text & Decline"
      section="buttons"
      expanded={expanded}
      onToggle={onToggle}
    />
    {expanded && (
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
);
