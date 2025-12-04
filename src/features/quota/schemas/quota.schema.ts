import { z } from 'zod'

/**
 * Schema for normalizing strings to lowercase and trimmed.
 * Use this for values that need case-insensitive comparison.
 */
export const normalizedStringSchema = z.string().transform((s) => s.toLowerCase().trim())

export const groupConfigSchema = z.object({
  values: z.array(normalizedStringSchema).min(1),
  target: z.number().min(0),
})

export const quotaSettingsSchema = z.object({
  groupByField: z.string().min(1),
  groups: z.record(z.string(), groupConfigSchema),
})

export type GroupConfigInput = z.infer<typeof groupConfigSchema>
export type QuotaSettingsInput = z.infer<typeof quotaSettingsSchema>
