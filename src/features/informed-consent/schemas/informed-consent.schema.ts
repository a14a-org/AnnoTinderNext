import { z } from 'zod'

export const consentCheckboxSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  required: z.boolean(),
})

export const customSectionSchema = z.object({
  title: z.string().min(1),
  content: z.string(),
})

export const informedConsentSettingsSchema = z.object({
  researchTitle: z.string().min(1),
  researchers: z.array(z.string()),
  contactEmail: z.email(),
  contactPerson: z.string().min(1),
  estimatedDuration: z.string().min(1),
  compensation: z.string().optional(),
  contentWarnings: z.array(z.string()).optional(),
  dataCollected: z.array(z.string()),
  dataProcessor: z.string().min(1),
  dataRetentionPeriod: z.string().min(1),
  minimumAge: z.number().min(0),
  customSections: z.array(customSectionSchema).optional(),
  agreeButtonText: z.string().optional(),
  declineButtonText: z.string().optional(),
  declineTitle: z.string().optional(),
  declineMessage: z.string().optional(),
  consentCheckboxes: z.array(consentCheckboxSchema).optional(),
})

export type ConsentCheckboxInput = z.infer<typeof consentCheckboxSchema>
export type CustomSectionInput = z.infer<typeof customSectionSchema>
export type InformedConsentSettingsInput = z.infer<typeof informedConsentSettingsSchema>
