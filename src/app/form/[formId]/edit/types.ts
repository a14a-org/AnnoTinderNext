import type { InformedConsentSettings } from "@/features/informed-consent";
import type { TextAnnotationSettings } from "@/features/annotation";
import type { DemographicsSettings } from "@/features/demographics";
import type { InstructionsSettings } from "@/features/instructions";

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
  displayOrder: number;
}

export interface Question {
  id: string;
  type: string;
  title: string;
  description: string | null;
  placeholder: string | null;
  isRequired: boolean;
  displayOrder: number;
  settings: Record<string, unknown> | null;
  options: QuestionOption[];
}

export interface QuestionUpdatePayload {
  type?: string;
  title?: string;
  description?: string | null;
  placeholder?: string | null;
  isRequired?: boolean;
  settings?: Record<string, unknown> | null;
  options?: Array<{ label: string; value: string }>;
}

export interface Form {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  brandColor: string | null;
  buttonText: string | null;
  submitText: string | null;
  isPublished: boolean;
  allowMultiple: boolean;
  showProgressBar: boolean;
  articlesPerSession: number;
  quotaSettings: string | null;
  sessionTimeoutMins: number;
  dynataEnabled: boolean;
  dynataReturnUrl: string | null;
  dynataBasicCode: string | null;
  assignmentStrategy: "INDIVIDUAL" | "JOB_SET";
  questions: Question[];
  _count: {
    submissions: number;
    articles: number;
  };
}

export interface QuotaSettings {
  groupByField: string;
  groups: Record<string, { values: string[]; target: number }>;
}

// Re-export types used by this feature
export type { InformedConsentSettings, TextAnnotationSettings, DemographicsSettings, InstructionsSettings };
