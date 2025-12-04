"use client";

import type { InformedConsentSettings } from "@/features/informed-consent";

import { useEffect, useRef, useState } from "react";

import { DEFAULT_CONSENT_SETTINGS } from "@/features/informed-consent";

const safeParseSettings = (
  initialSettings: InformedConsentSettings | null
): InformedConsentSettings => {
  try {
    if (!initialSettings) {
      return { ...DEFAULT_CONSENT_SETTINGS };
    }

    return {
      ...DEFAULT_CONSENT_SETTINGS,
      ...initialSettings,
      researchers: initialSettings?.researchers?.length
        ? initialSettings.researchers
        : DEFAULT_CONSENT_SETTINGS.researchers,
      dataCollected: initialSettings?.dataCollected?.length
        ? initialSettings.dataCollected
        : DEFAULT_CONSENT_SETTINGS.dataCollected,
    };
  } catch {
    console.warn("Failed to parse consent settings, using defaults");
    return DEFAULT_CONSENT_SETTINGS;
  }
};

interface UseConsentSettingsResult {
  settings: InformedConsentSettings;
  setSettings: React.Dispatch<React.SetStateAction<InformedConsentSettings>>;
  saveStatus: "idle" | "saving" | "saved";
  updateSetting: <K extends keyof InformedConsentSettings>(
    key: K,
    value: InformedConsentSettings[K]
  ) => void;
}

export const useConsentSettings = (
  initialSettings: InformedConsentSettings | null,
  onUpdate: (settings: InformedConsentSettings) => void
): UseConsentSettingsResult => {
  const [settings, setSettings] = useState<InformedConsentSettings>(() =>
    safeParseSettings(initialSettings)
  );
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);
  const pendingSettingsRef = useRef<InformedConsentSettings | null>(null);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      initialLoadRef.current = false;
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (initialLoadRef.current) return;

    pendingSettingsRef.current = settings;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus("saving");
      onUpdateRef.current(settings);
      pendingSettingsRef.current = null;
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [settings]);

  useEffect(() => {
    return () => {
      if (pendingSettingsRef.current && !initialLoadRef.current) {
        onUpdateRef.current(pendingSettingsRef.current);
      }
    };
  }, []);

  const updateSetting = <K extends keyof InformedConsentSettings>(
    key: K,
    value: InformedConsentSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return { settings, setSettings, saveStatus, updateSetting };
};
