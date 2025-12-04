import { z } from 'zod'

export const createFormSchema = z.object({
  title: z.string().min(1, 'Title is required').transform((s) => s.trim()),
  description: z.string().optional(),
})

export const updateFormSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  brandColor: z.string().optional(),
  articlesPerSession: z.number().min(1).optional(),
  quotaSettings: z.record(z.string(), z.unknown()).optional(),
})

export const createQuestionSchema = z.object({
  type: z.enum([
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
  ]),
  title: z.string().optional(),
  description: z.string().optional(),
})

export const updateQuestionSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  required: z.boolean().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  options: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).optional(),
  placeholder: z.string().optional(),
})

export const createSessionSchema = z.object({
  externalPid: z.string().optional(),
  returnUrl: z.string().url().optional(),
})

export type CreateFormInput = z.infer<typeof createFormSchema>
export type UpdateFormInput = z.infer<typeof updateFormSchema>
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>
export type CreateSessionInput = z.infer<typeof createSessionSchema>
