"use client";

import type { InformedConsentSettings } from "@/features/informed-consent";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ShieldCheck, X } from "lucide-react";

import {
  DEFAULT_CONSENT_SETTINGS,
  generateConsentText,
} from "@/features/informed-consent";

interface InformedConsentDisplayProps {
  title: string;
  description?: string | null;
  settings: InformedConsentSettings | null;
  brandColor: string;
  onAgree: () => void;
  onDecline: () => void;
}

export const InformedConsentDisplay = ({
  title,
  description,
  settings: rawSettings,
  brandColor,
  onAgree,
  onDecline,
}: InformedConsentDisplayProps) => {
  const settings = rawSettings || DEFAULT_CONSENT_SETTINGS;
  const consentText = generateConsentText(settings);
  const checkboxes = useMemo(
    () => settings.consentCheckboxes || DEFAULT_CONSENT_SETTINGS.consentCheckboxes || [],
    [settings.consentCheckboxes]
  );

  // Split the consent text into sections for better rendering
  const sections = consentText.split("\n\n").filter(Boolean);

  // Checkbox state
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Check if all required checkboxes are checked
  const allRequiredChecked = checkboxes
    .filter((cb) => cb.required)
    .every((cb) => checkedItems[cb.id]);

  // Toggle checkbox
  const toggleCheckbox = useCallback((id: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Number keys 1-9 for checkboxes
      if (/^[1-9]$/.test(e.key)) {
        const index = parseInt(e.key) - 1;
        if (index < checkboxes.length) {
          e.preventDefault();
          toggleCheckbox(checkboxes[index].id);
        }
        return;
      }

      // Y to agree (only if all required checked)
      if (e.key.toLowerCase() === "y" && allRequiredChecked) {
        e.preventDefault();
        onAgree();
        return;
      }

      // N to decline
      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        onDecline();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [checkboxes, toggleCheckbox, allRequiredChecked, onAgree, onDecline]);

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: `${brandColor}20` }}
        >
          <ShieldCheck className="w-8 h-8" style={{ color: brandColor }} />
        </div>
        <h1 className="text-3xl font-display font-bold text-obsidian mb-2">
          {title}
        </h1>
        {description && (
          <p className="text-lg text-obsidian-muted">
            {description}
          </p>
        )}
      </div>

      {/* Consent Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 max-h-[50vh] overflow-y-auto">
        <div className="prose prose-sm max-w-none">
          {sections.map((section, index) => {
            // Check if it's a header
            if (section.startsWith("## ")) {
              const headerText = section.replace("## ", "");
              return (
                <h2
                  key={index}
                  className="text-lg font-semibold text-obsidian mt-6 first:mt-0 mb-2"
                >
                  {headerText}
                </h2>
              );
            }
            // Check if it's a divider
            if (section.startsWith("---")) {
              return <hr key={index} className="my-4 border-gray-200" />;
            }
            // Regular paragraph
            return (
              <p key={index} className="text-obsidian-muted mb-3 leading-relaxed">
                {section}
              </p>
            );
          })}
        </div>
      </div>

      {/* Consent Checkboxes */}
      {checkboxes.length > 0 && (
        <div className="mb-8 space-y-3">
          {checkboxes.map((checkbox, index) => (
            <button
              key={checkbox.id}
              onClick={() => toggleCheckbox(checkbox.id)}
              className={`w-full p-4 text-left rounded-xl border-2 transition-all flex items-center gap-3 ${
                checkedItems[checkbox.id]
                  ? "border-current bg-opacity-10"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              style={{
                borderColor: checkedItems[checkbox.id] ? brandColor : undefined,
                backgroundColor: checkedItems[checkbox.id] ? `${brandColor}15` : undefined,
              }}
            >
              <span
                className="w-8 h-8 rounded-lg border-2 flex items-center justify-center text-sm font-medium shrink-0"
                style={{
                  borderColor: checkedItems[checkbox.id] ? brandColor : "#D1D5DB",
                  backgroundColor: checkedItems[checkbox.id] ? brandColor : undefined,
                }}
              >
                {checkedItems[checkbox.id] ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <span className="text-gray-400">{index + 1}</span>
                )}
              </span>
              <span className={`${checkedItems[checkbox.id] ? "text-obsidian" : "text-obsidian-muted"}`}>
                {checkbox.label}
                {checkbox.required && <span className="text-red-500 ml-1">*</span>}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={onAgree}
          disabled={!allRequiredChecked}
          className={`w-full p-4 text-left rounded-xl border-2 transition-all flex items-center gap-3 ${
            allRequiredChecked
              ? "border-green-500 bg-green-50 hover:bg-green-100"
              : "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
          }`}
        >
          <span
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              allRequiredChecked ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <Check className="w-5 h-5 text-white" />
          </span>
          <span className={`font-medium ${allRequiredChecked ? "text-green-700" : "text-gray-400"}`}>
            {settings.agreeButtonText || DEFAULT_CONSENT_SETTINGS.agreeButtonText}
          </span>
          {allRequiredChecked && (
            <kbd className="ml-auto px-2 py-1 bg-white rounded shadow text-xs text-gray-500">Y</kbd>
          )}
        </button>

        <button
          onClick={onDecline}
          className="w-full p-4 text-left rounded-xl border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all flex items-center gap-3"
        >
          <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
            <X className="w-5 h-5 text-gray-500" />
          </span>
          <span className="font-medium text-obsidian-muted">
            {settings.declineButtonText || DEFAULT_CONSENT_SETTINGS.declineButtonText}
          </span>
          <kbd className="ml-auto px-2 py-1 bg-white rounded shadow text-xs text-gray-500">N</kbd>
        </button>
      </div>

      {/* Keyboard hint */}
      <div className="text-center mt-6 text-sm text-obsidian-muted">
        Press{" "}
        {checkboxes.map((_, index) => (
          <span key={index}>
            <kbd className="px-2 py-1 bg-white rounded shadow text-xs">{index + 1}</kbd>
            {index < checkboxes.length - 1 && " "}
          </span>
        ))}
        {checkboxes.length > 0 && " to toggle checkboxes · "}
        <kbd className="px-2 py-1 bg-white rounded shadow text-xs">Y</kbd> to agree ·{" "}
        <kbd className="px-2 py-1 bg-white rounded shadow text-xs">N</kbd> to decline
      </div>
    </div>
  );
};

interface ConsentDeclinedDisplayProps {
  settings: InformedConsentSettings | null;
  brandColor: string;
}

export const ConsentDeclinedDisplay = ({
  settings: rawSettings,
  brandColor,
}: ConsentDeclinedDisplayProps) => {
  const settings = rawSettings || DEFAULT_CONSENT_SETTINGS;

  return (
    <div className="w-full max-w-xl mx-auto text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{ backgroundColor: `${brandColor}20` }}
      >
        <X className="w-8 h-8 text-obsidian-muted" />
      </div>
      <h1 className="text-3xl font-display font-bold text-obsidian mb-4">
        {settings.declineTitle || DEFAULT_CONSENT_SETTINGS.declineTitle}
      </h1>
      <p className="text-lg text-obsidian-muted mb-8">
        {settings.declineMessage || DEFAULT_CONSENT_SETTINGS.declineMessage}
      </p>
      <p className="text-sm text-obsidian-muted">
        U kunt dit venster nu sluiten.
      </p>
    </div>
  );
};
