import type { TextAnnotationSettings } from "@/features/annotation";

export interface AnnotationEditorProps {
  settings: TextAnnotationSettings | null;
  onUpdate: (settings: TextAnnotationSettings) => void;
  articleCount?: number;
  articlesPerSession?: number;
}

export interface SectionProps {
  settings: TextAnnotationSettings;
  updateSetting: <K extends keyof TextAnnotationSettings>(
    key: K,
    value: TextAnnotationSettings[K]
  ) => void;
}
