import type {
  Annotation,
  TextAnnotationSettings,
} from "@/features/annotation";

export type Phase = "practice" | "transition" | "main";

export interface AnnotationDisplayProps {
  settings: TextAnnotationSettings;
  brandColor: string | undefined;
  onComplete: (annotations: Annotation[]) => void;
  /** Session token for saving annotations to the API */
  sessionToken: string | undefined;
  /** Form ID for API calls */
  formId: string | undefined;
}

export interface SegmentSelectionState {
  selectedText: string | null;
  selectedIndices: { start: number; end: number } | null;
  showFollowUp: boolean;
  followUpAnswers: Record<string, string | number | null>;
}
