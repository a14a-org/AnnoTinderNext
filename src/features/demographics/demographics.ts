/**
 * Demographics Question Type
 *
 * Collects participant demographics for quota-based assignment.
 * Typically shown after informed consent, before annotation task.
 */

export interface SliderConfig {
  min: number
  max: number
  step: number
  minLabel?: string
  maxLabel?: string
  showValue?: boolean
}

export interface DemographicField {
  id: string
  label: string
  type: 'single_choice' | 'text' | 'slider' | 'month_year' | 'single_choice_other'
  options?: string[]
  required: boolean
  placeholder?: string
  /** For single_choice_other: which option triggers the text input */
  otherOptionValue?: string
  /** For slider type: configuration */
  sliderConfig?: SliderConfig
  /**
   * Conditional follow-up fields to show after a specific option is chosen on a
   * single_choice / single_choice_other field. Keyed by option value (the literal
   * option string for single_choice; the otherOptionValue for the open-text branch).
   * Selected by an exact match on the user's stored answer for this field.
   */
  optionFollowUps?: Record<string, DemographicField[]>
}

export interface DemographicsSettings {
  title: string
  description: string
  fields: DemographicField[]
  caucasianEthnicities: string[]
}

export const DEFAULT_DEMOGRAPHICS_SETTINGS: DemographicsSettings = {
  title: 'Over jezelf',
  description:
    'We stellen je een paar korte vragen om te zorgen dat ons onderzoek een goede afspiegeling is van de Nederlandse samenleving.',
  fields: [
    {
      id: 'gender',
      label: 'Wat is je geslacht?',
      type: 'single_choice',
      options: ['Man', 'Vrouw', 'Anders', 'Zeg ik liever niet'],
      required: true,
    },
    {
      id: 'ethnicity',
      label: 'Tot welke bevolkingsgroep reken je jezelf?',
      type: 'single_choice',
      options: [
        'Nederlands',
        'Surinaams',
        'Turks',
        'Marokkaans',
        'Antilliaans/Arubaans',
        'Indonesisch',
        'Duits',
        'Pools',
        'Anders',
        'Zeg ik liever niet',
      ],
      required: true,
    },
    {
      id: 'ageRange',
      label: 'Wat is je leeftijdscategorie?',
      type: 'single_choice',
      options: ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'],
      required: true,
    },
  ],
  caucasianEthnicities: ['nederlands', 'duits', 'pools'],
}

/**
 * Normalize a string for comparison (lowercase and trimmed).
 * Use this when comparing user input against normalized stored values.
 */
export const normalizeForComparison = (value: string): string =>
  value.toLowerCase().trim()

export type DemographicAnswers = Record<string, string | undefined>

/**
 * Classify a user's demographic group based on ethnicity.
 * Both input ethnicity and caucasianEthnicities are normalized before comparison.
 * This ensures case-insensitive matching regardless of input source.
 */
export const classifyDemographic = (
  ethnicity: string,
  caucasianEthnicities: string[] = DEFAULT_DEMOGRAPHICS_SETTINGS.caucasianEthnicities
): 'caucasian' | 'minority' => {
  const normalizedEthnicity = normalizeForComparison(ethnicity)
  const normalizedCaucasianEthnicities = caucasianEthnicities.map(normalizeForComparison)
  const isCaucasian = normalizedCaucasianEthnicities.includes(normalizedEthnicity)
  return isCaucasian ? 'caucasian' : 'minority'
}

/**
 * Pick the follow-up fields that apply for a given parent field's answer, if any.
 * Matches the answer against optionFollowUps keys; for single_choice_other answers
 * formatted as "OtherOption: <text>", we strip back to the bare option value before lookup.
 */
export const getActiveFollowUps = (
  field: DemographicField,
  answer: string | undefined
): DemographicField[] => {
  if (!field.optionFollowUps || answer === undefined) return []
  if (field.optionFollowUps[answer]) return field.optionFollowUps[answer]
  // single_choice_other stores answers as `${otherOptionValue}: <text>` once filled in.
  // Match the bare otherOptionValue against the optionFollowUps map.
  if (field.otherOptionValue) {
    const prefix = `${field.otherOptionValue}: `
    if (answer.startsWith(prefix) && field.optionFollowUps[field.otherOptionValue]) {
      return field.optionFollowUps[field.otherOptionValue]
    }
  }
  return []
}

/**
 * Walk the fields tree and inline any active follow-ups into a single ordered list.
 * The list is what UI navigation steps through, and what validation iterates over.
 */
export const flattenFields = (
  fields: DemographicField[],
  answers: DemographicAnswers
): DemographicField[] => {
  const collected: DemographicField[] = []
  for (const field of fields) {
    collected.push(field)
    const followUps = getActiveFollowUps(field, answers[field.id])
    if (followUps.length > 0) {
      collected.push(...flattenFields(followUps, answers))
    }
  }
  return collected
}

/**
 * Validate that all required fields have answers, including conditional follow-ups
 * whose parent option is currently selected.
 */
export const validateDemographics = (
  answers: DemographicAnswers,
  settings: DemographicsSettings
): { valid: boolean; missingFields: string[] } => {
  const required = flattenFields(settings.fields, answers)
  const missingFields = required
    .filter((field) => field.required && !answers[field.id])
    .map((field) => field.id)

  return {
    valid: missingFields.length === 0,
    missingFields,
  }
}
