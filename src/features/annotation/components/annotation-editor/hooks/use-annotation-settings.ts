"use client";

import type { TextAnnotationSettings, FollowUpQuestion } from "@/features/annotation";

import { useEffect, useRef, useState } from "react";

import { DEFAULT_ANNOTATION_SETTINGS } from "@/features/annotation";

// Safely parse settings to avoid "too many properties" error
const safeParseSettings = (initialSettings: TextAnnotationSettings | null): TextAnnotationSettings => {
  try {
    if (!initialSettings) {
      return { ...DEFAULT_ANNOTATION_SETTINGS };
    }

    const texts = Array.isArray(initialSettings.texts)
      ? initialSettings.texts
      : DEFAULT_ANNOTATION_SETTINGS.texts;

    const practiceTexts = Array.isArray(initialSettings.practiceTexts)
      ? initialSettings.practiceTexts
      : [];

    let followUpQuestions: FollowUpQuestion[] = [];
    if (Array.isArray(initialSettings.followUpQuestions) && initialSettings.followUpQuestions.length > 0) {
      followUpQuestions = initialSettings.followUpQuestions;
    } else if (initialSettings.followUp) {
      followUpQuestions = [{
        id: "migrated-q1",
        type: initialSettings.followUp.type || "multiple_choice",
        question: initialSettings.followUp.question || "",
        isRequired: true,
        options: initialSettings.followUp.options,
        placeholder: initialSettings.followUp.placeholder,
        minRating: initialSettings.followUp.minRating,
        maxRating: initialSettings.followUp.maxRating,
        minLabel: initialSettings.followUp.minLabel,
        maxLabel: initialSettings.followUp.maxLabel,
        minWords: undefined,
      }];
    } else {
      followUpQuestions = DEFAULT_ANNOTATION_SETTINGS.followUpQuestions;
    }

    // Handle backward compatibility for nothingFoundButtonText (from skipButtonText)
    const nothingFoundButtonText = initialSettings?.nothingFoundButtonText
      ?? initialSettings?.skipButtonText
      ?? DEFAULT_ANNOTATION_SETTINGS.nothingFoundButtonText;

    return {
      texts,
      practiceTexts,
      textSource: initialSettings?.textSource ?? DEFAULT_ANNOTATION_SETTINGS.textSource,
      showPracticeFirst: initialSettings?.showPracticeFirst ?? DEFAULT_ANNOTATION_SETTINGS.showPracticeFirst,
      selectionMode: initialSettings?.selectionMode ?? DEFAULT_ANNOTATION_SETTINGS.selectionMode,
      highlightColor: initialSettings?.highlightColor ?? DEFAULT_ANNOTATION_SETTINGS.highlightColor,
      instructionText: initialSettings?.instructionText ?? DEFAULT_ANNOTATION_SETTINGS.instructionText,
      allowSkip: initialSettings?.allowSkip ?? DEFAULT_ANNOTATION_SETTINGS.allowSkip,
      skipButtonText: initialSettings?.skipButtonText ?? DEFAULT_ANNOTATION_SETTINGS.skipButtonText,
      minimumTimeOnPage: initialSettings?.minimumTimeOnPage ?? DEFAULT_ANNOTATION_SETTINGS.minimumTimeOnPage,
      followUp: undefined,
      followUpQuestions,
      // Multi-selection settings with defaults
      multiSelectMode: initialSettings?.multiSelectMode ?? DEFAULT_ANNOTATION_SETTINGS.multiSelectMode,
      maxSelectionsPerArticle: initialSettings?.maxSelectionsPerArticle ?? DEFAULT_ANNOTATION_SETTINGS.maxSelectionsPerArticle,
      minSelectionsPerArticle: initialSettings?.minSelectionsPerArticle ?? DEFAULT_ANNOTATION_SETTINGS.minSelectionsPerArticle,
      maxNothingFoundPerSession: initialSettings?.maxNothingFoundPerSession ?? DEFAULT_ANNOTATION_SETTINGS.maxNothingFoundPerSession,
      nothingFoundButtonText,
    };
  } catch {
    console.warn("Failed to parse annotation settings, using defaults");
    return DEFAULT_ANNOTATION_SETTINGS;
  }
};

interface UseAnnotationSettingsResult {
  settings: TextAnnotationSettings;
  setSettings: React.Dispatch<React.SetStateAction<TextAnnotationSettings>>;
  saveStatus: "idle" | "saving" | "saved";
  updateSetting: <K extends keyof TextAnnotationSettings>(key: K, value: TextAnnotationSettings[K]) => void;
}

export const useAnnotationSettings = (
  initialSettings: TextAnnotationSettings | null,
  onUpdate: (settings: TextAnnotationSettings) => void
): UseAnnotationSettingsResult => {
  const [settings, setSettings] = useState<TextAnnotationSettings>(() =>
    safeParseSettings(initialSettings)
  );
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);
  const pendingSettingsRef = useRef<TextAnnotationSettings | null>(null);
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

  const updateSetting = <K extends keyof TextAnnotationSettings>(
    key: K,
    value: TextAnnotationSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return { settings, setSettings, saveStatus, updateSetting };
};
