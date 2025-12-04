import type { InformedConsentSettings } from "@/features/informed-consent";

export interface InformedConsentEditorProps {
  settings: InformedConsentSettings | null;
  onUpdate: (settings: InformedConsentSettings) => void;
}

export interface SectionProps {
  settings: InformedConsentSettings;
  updateSetting: <K extends keyof InformedConsentSettings>(
    key: K,
    value: InformedConsentSettings[K]
  ) => void;
}

export type SectionKey = "research" | "procedure" | "data" | "buttons" | "preview";
