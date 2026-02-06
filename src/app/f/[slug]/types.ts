import type { Annotation, TextAnnotationSettings } from "@/features/annotation";
import type { DemographicAnswers, DemographicsSettings } from "@/features/demographics";
import type { InformedConsentSettings } from "@/features/informed-consent";

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
}

export interface Question {
  id: string;
  type: string;
  title: string;
  description: string | null;
  placeholder: string | null;
  isRequired: boolean;
  settings: Record<string, unknown> | null;
  options: QuestionOption[];
}

export interface FormData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  brandColor: string | null;
  buttonText: string | null;
  submitText: string | null;
  showProgressBar: boolean;
  articlesPerSession: number;
  quotaSettings: {
    groupByField: string;
    groups: Record<string, { values: string[]; target: number }>;
  } | null;
  sessionTimeoutMins: number;
  // Panel integrations
  dynataEnabled: boolean;
  dynataReturnUrl: string | null;
  dynataBasicCode: string | null;
  motivactionEnabled: boolean;
  motivactionReturnUrl: string | null;
  questions: Question[];
}

export interface SessionData {
  id: string;
  sessionToken: string;
  demographicGroup: string | null;
  assignedArticleIds: string | null;
  articlesRequired: number;
  articlesCompleted: number;
  status: string;
}

export interface AssignedArticle {
  id: string;
  shortId: string;
  text: string;
}

export type AnswerValue = string | number | boolean | string[] | null;

// Re-export types used by this feature
export type { Annotation, TextAnnotationSettings, DemographicAnswers, DemographicsSettings, InformedConsentSettings };
