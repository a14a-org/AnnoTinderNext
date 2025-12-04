import { z } from 'zod'

/**
 * Schema for normalizing strings to lowercase and trimmed.
 * Use this for values that need case-insensitive comparison.
 */
export const normalizedStringSchema = z.string().transform((s) => s.toLowerCase().trim())

export const demographicFieldSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['single_choice', 'text']),
  options: z.array(z.string()).optional(),
  required: z.boolean(),
  placeholder: z.string().optional(),
})

export const demographicsSettingsSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  fields: z.array(demographicFieldSchema),
  caucasianEthnicities: z.array(normalizedStringSchema),
})

export const demographicAnswersSchema = z.record(z.string(), z.string().optional())

export type DemographicFieldInput = z.infer<typeof demographicFieldSchema>
export type DemographicsSettingsInput = z.infer<typeof demographicsSettingsSchema>
export type DemographicAnswersInput = z.infer<typeof demographicAnswersSchema>
