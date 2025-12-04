/**
 * Type Guards
 *
 * Type guard functions with `is` prefix for runtime type checking.
 */

import type { InformedConsentSettings } from "@/features/informed-consent"
import type { TextAnnotationSettings } from "@/features/annotation"
import type { DemographicsSettings } from "@/features/demographics"

/**
 * Check if a value is defined (not null or undefined)
 */
export const isDefined = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined

/**
 * Check if a string is non-empty
 */
export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0

/**
 * Check if an array is non-empty
 */
export const isNonEmptyArray = <T>(value: T[] | null | undefined): value is T[] =>
  Array.isArray(value) && value.length > 0

/**
 * Check if a value is a valid question type
 */
export const isValidQuestionType = (type: unknown): type is QuestionType =>
  typeof type === 'string' && VALID_QUESTION_TYPES.includes(type as QuestionType)

export type QuestionType =
  | 'WELCOME_SCREEN'
  | 'THANK_YOU_SCREEN'
  | 'INFORMED_CONSENT'
  | 'DEMOGRAPHICS'
  | 'TEXT_ANNOTATION'
  | 'MULTIPLE_CHOICE'
  | 'DROPDOWN'
  | 'SHORT_TEXT'
  | 'LONG_TEXT'
  | 'EMAIL'
  | 'NUMBER'
  | 'DATE'
  | 'RATING'

const VALID_QUESTION_TYPES: QuestionType[] = [
  'WELCOME_SCREEN',
  'THANK_YOU_SCREEN',
  'INFORMED_CONSENT',
  'DEMOGRAPHICS',
  'TEXT_ANNOTATION',
  'MULTIPLE_CHOICE',
  'DROPDOWN',
  'SHORT_TEXT',
  'LONG_TEXT',
  'EMAIL',
  'NUMBER',
  'DATE',
  'RATING',
]

/**
 * Check if a value is a valid session status
 */
export const isValidSessionStatus = (status: unknown): status is SessionStatus =>
  typeof status === 'string' && VALID_SESSION_STATUSES.includes(status as SessionStatus)

export type SessionStatus =
  | 'started'
  | 'demographics'
  | 'annotating'
  | 'completed'
  | 'screened_out'
  | 'expired'

const VALID_SESSION_STATUSES: SessionStatus[] = [
  'started',
  'demographics',
  'annotating',
  'completed',
  'screened_out',
  'expired',
]

/**
 * Check if a value is a valid selection mode
 */
export const isValidSelectionMode = (mode: unknown): mode is 'word' | 'sentence' =>
  mode === 'word' || mode === 'sentence'

/**
 * Check if a value is a valid follow-up type
 */
export const isValidFollowUpType = (type: unknown): type is 'multiple_choice' | 'open_text' | 'rating_scale' =>
  type === 'multiple_choice' || type === 'open_text' || type === 'rating_scale'

/**
 * Check if an object has a specific property
 */
export const hasProperty = <K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> =>
  typeof obj === 'object' && obj !== null && key in obj

/**
 * Check if a value is a record/object
 */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Type guard for InformedConsentSettings
 */
export const isInformedConsentSettings = (
  settings: unknown
): settings is InformedConsentSettings => {
  if (!settings || typeof settings !== "object") return false
  const s = settings as Record<string, unknown>
  return (
    typeof s.title === "string" &&
    typeof s.content === "string" &&
    typeof s.requiresAcceptance === "boolean"
  )
}

/**
 * Type guard for TextAnnotationSettings
 */
export const isTextAnnotationSettings = (
  settings: unknown
): settings is TextAnnotationSettings => {
  if (!settings || typeof settings !== "object") return false
  const s = settings as Record<string, unknown>
  return (
    Array.isArray(s.texts) &&
    (s.selectionMode === "sentence" || s.selectionMode === "word") &&
    typeof s.highlightColor === "string"
  )
}

/**
 * Type guard for DemographicsSettings
 */
export const isDemographicsSettings = (
  settings: unknown
): settings is DemographicsSettings => {
  if (!settings || typeof settings !== "object") return false
  const s = settings as Record<string, unknown>
  return Array.isArray(s.fields)
}
