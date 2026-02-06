/**
 * Form Export/Import Types
 *
 * These types define the structure of exported form data.
 * Version is included for future compatibility.
 */

export const FORM_EXPORT_VERSION = "1.0";

export interface ExportedQuestionOption {
  label: string;
  value: string | null;
  displayOrder: number;
}

export interface ExportedQuestion {
  type: string;
  title: string;
  description: string | null;
  placeholder: string | null;
  isRequired: boolean;
  displayOrder: number;
  settings: Record<string, unknown> | null;
  options: ExportedQuestionOption[];
}

export interface ExportedArticle {
  shortId: string;
  text: string;
}

export interface ExportedJobSet {
  shortId: string;
  articleShortIds: string[];
}

export interface ExportedFormSettings {
  title: string;
  description: string | null;
  brandColor: string | null;
  buttonText: string | null;
  submitText: string | null;
  showProgressBar: boolean;
  articlesPerSession: number;
  sessionTimeoutMins: number;
  quotaSettings: Record<string, unknown> | null;
  assignmentStrategy: string;
  dynataEnabled: boolean;
  dynataReturnUrl: string | null;
  dynataBasicCode: string | null;
  motivactionEnabled: boolean;
  motivactionReturnUrl: string | null;
}

export interface FormExportData {
  version: string;
  exportedAt: string;
  form: ExportedFormSettings;
  questions: ExportedQuestion[];
  articles: ExportedArticle[];
  jobSets: ExportedJobSet[];
}

export interface FormImportResult {
  formId: string;
  slug: string;
  title: string;
  questionsImported: number;
  articlesImported: number;
  jobSetsImported: number;
}
