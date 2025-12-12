/**
 * Flexible Quota Settings System
 *
 * Allows configuring article quotas based on any demographic field.
 * Replaces the hardcoded caucasian/minority system.
 */

export interface GroupConfig {
  values: string[]
  target: number
}

export interface QuotaSettings {
  groupByField: string
  groups: Record<string, GroupConfig>
}

export const DEFAULT_QUOTA_SETTINGS: QuotaSettings = {
  groupByField: 'ethnicity',
  groups: {
    dutch: {
      values: ['nederlands', 'duits', 'pools'],
      target: 2,
    },
    minority: {
      values: [
        'surinaams',
        'turks',
        'marokkaans',
        'antilliaans/arubaans',
        'indonesisch',
        'anders',
      ],
      target: 4,
    },
  },
}

/**
 * Normalize a string for comparison (lowercase and trimmed).
 * Use this when comparing user input against normalized stored values.
 */
export const normalizeForComparison = (value: string): string =>
  value.toLowerCase().trim()

/**
 * Classify a participant into a demographic group based on their answers.
 * Both input fieldValue and config values are normalized before comparison.
 * This ensures case-insensitive matching regardless of input source.
 */
export const classifyParticipant = (
  demographics: Record<string, string | undefined>,
  quotaSettings: QuotaSettings
): string | null => {
  const fieldValue = demographics[quotaSettings.groupByField]
  if (!fieldValue) return null

  const normalizedFieldValue = normalizeForComparison(fieldValue)
  const matchingGroup = Object.entries(quotaSettings.groups).find(([, config]) => {
    const normalizedValues = config.values.map(normalizeForComparison)
    return normalizedValues.includes(normalizedFieldValue)
  })

  return matchingGroup ? matchingGroup[0] : null
}

/**
 * Get the quota target for a specific group
 */
export const getGroupTarget = (
  groupName: string,
  quotaSettings: QuotaSettings
): number => quotaSettings.groups[groupName]?.target ?? 0

/**
 * Parse quota counts from JSON string
 */
export const parseQuotaCounts = (
  quotaCountsJson: string | null
): Record<string, number> => {
  if (!quotaCountsJson) return {}
  try {
    return JSON.parse(quotaCountsJson)
  } catch {
    return {}
  }
}

/**
 * Check if an article has quota space for a demographic group
 */
export const hasQuotaSpace = (
  quotaCounts: Record<string, number>,
  groupName: string,
  quotaSettings: QuotaSettings
): boolean => {
  const currentCount = quotaCounts[groupName] ?? 0
  const target = getGroupTarget(groupName, quotaSettings)
  return currentCount < target
}

/**
 * Get all available demographic fields from the demographics settings
 */
export const getAvailableDemographicFields = (): string[] => [
  'ethnicity',
  'gender',
  'ageRange',
]

/**
 * Validate quota settings
 */
export const validateQuotaSettings = (
  settings: QuotaSettings
): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!settings.groupByField) {
    errors.push('groupByField is required')
  }

  if (!settings.groups || Object.keys(settings.groups).length === 0) {
    errors.push('At least one group must be defined')
  }

  const groupErrors = Object.entries(settings.groups ?? {}).flatMap(([groupName, config]) => {
    const configErrors: string[] = []
    if (!config.values || config.values.length === 0) {
      configErrors.push(`Group "${groupName}" must have at least one value`)
    }
    if (typeof config.target !== 'number' || config.target < 0) {
      configErrors.push(`Group "${groupName}" must have a valid target >= 0`)
    }
    return configErrors
  })
  errors.push(...groupErrors)

  return {
    valid: errors.length === 0,
    errors,
  }
}
