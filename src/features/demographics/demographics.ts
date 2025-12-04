/**
 * Demographics Question Type
 *
 * Collects participant demographics for quota-based assignment.
 * Typically shown after informed consent, before annotation task.
 */

export interface DemographicField {
  id: string
  label: string
  type: 'single_choice' | 'text'
  options: string[] | undefined
  required: boolean
  placeholder: string | undefined
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
      placeholder: undefined,
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
      ],
      required: true,
      placeholder: undefined,
    },
    {
      id: 'ageRange',
      label: 'Wat is je leeftijdscategorie?',
      type: 'single_choice',
      options: ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'],
      required: true,
      placeholder: undefined,
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
 * Validate that all required fields have answers
 */
export const validateDemographics = (
  answers: DemographicAnswers,
  settings: DemographicsSettings
): { valid: boolean; missingFields: string[] } => {
  const missingFields = settings.fields
    .filter((field) => field.required && !answers[field.id])
    .map((field) => field.id)

  return {
    valid: missingFields.length === 0,
    missingFields,
  }
}
