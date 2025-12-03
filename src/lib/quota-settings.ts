/**
 * Flexible Quota Settings System
 *
 * Allows configuring article quotas based on any demographic field.
 * Replaces the hardcoded caucasian/minority system.
 */

export interface GroupConfig {
  /** Field values that map to this group */
  values: string[];
  /** Quota target per article for this group */
  target: number;
}

export interface QuotaSettings {
  /** Which demographic field to use for grouping (e.g., "ethnicity", "ageRange", "gender") */
  groupByField: string;

  /** Define groups and their quotas */
  groups: {
    [groupName: string]: GroupConfig;
  };
}

/**
 * Default quota settings - mirrors the previous hardcoded behavior
 */
export const DEFAULT_QUOTA_SETTINGS: QuotaSettings = {
  groupByField: "ethnicity",
  groups: {
    dutch: {
      values: ["Nederlands", "Duits", "Pools"],
      target: 1,
    },
    minority: {
      values: [
        "Surinaams",
        "Turks",
        "Marokkaans",
        "Antilliaans/Arubaans",
        "Indonesisch",
        "Anders",
      ],
      target: 2,
    },
  },
};

/**
 * Classify a participant into a demographic group based on their answers
 */
export function classifyParticipant(
  demographics: Record<string, string | undefined>,
  quotaSettings: QuotaSettings
): string | null {
  const fieldValue = demographics[quotaSettings.groupByField];
  if (!fieldValue) return null;

  // Find which group this value belongs to
  for (const [groupName, config] of Object.entries(quotaSettings.groups)) {
    const normalizedValues = config.values.map((v) => v.toLowerCase());
    if (normalizedValues.includes(fieldValue.toLowerCase())) {
      return groupName;
    }
  }

  // No matching group found
  return null;
}

/**
 * Get the quota target for a specific group
 */
export function getGroupTarget(
  groupName: string,
  quotaSettings: QuotaSettings
): number {
  return quotaSettings.groups[groupName]?.target ?? 0;
}

/**
 * Parse quota counts from JSON string
 */
export function parseQuotaCounts(quotaCountsJson: string | null): Record<string, number> {
  if (!quotaCountsJson) return {};
  try {
    return JSON.parse(quotaCountsJson);
  } catch {
    return {};
  }
}

/**
 * Check if an article has quota space for a demographic group
 */
export function hasQuotaSpace(
  quotaCounts: Record<string, number>,
  groupName: string,
  quotaSettings: QuotaSettings
): boolean {
  const currentCount = quotaCounts[groupName] || 0;
  const target = getGroupTarget(groupName, quotaSettings);
  return currentCount < target;
}

/**
 * Get all available demographic fields from the demographics settings
 */
export function getAvailableDemographicFields(): string[] {
  return ["ethnicity", "gender", "ageRange"];
}

/**
 * Validate quota settings
 */
export function validateQuotaSettings(settings: QuotaSettings): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!settings.groupByField) {
    errors.push("groupByField is required");
  }

  if (!settings.groups || Object.keys(settings.groups).length === 0) {
    errors.push("At least one group must be defined");
  }

  for (const [groupName, config] of Object.entries(settings.groups || {})) {
    if (!config.values || config.values.length === 0) {
      errors.push(`Group "${groupName}" must have at least one value`);
    }
    if (typeof config.target !== "number" || config.target < 0) {
      errors.push(`Group "${groupName}" must have a valid target >= 0`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
