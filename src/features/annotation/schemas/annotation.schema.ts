import { z } from 'zod'

export const followUpOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
})

export const followUpQuestionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['multiple_choice', 'open_text', 'rating_scale']),
  question: z.string().min(1),
  isRequired: z.boolean(),
  options: z.array(followUpOptionSchema).optional(),
  placeholder: z.string().optional(),
  minRating: z.number().optional(),
  maxRating: z.number().optional(),
  minLabel: z.string().optional(),
  maxLabel: z.string().optional(),
})

export const textItemSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
  metadata: z.record(z.string(), z.string()).optional(),
})

export const textAnnotationSettingsSchema = z.object({
  selectionMode: z.enum(['word', 'sentence']),
  followUpQuestions: z.array(followUpQuestionSchema),
  textSource: z.enum(['manual', 'database']),
  texts: z.array(textItemSchema),
  practiceTexts: z.array(textItemSchema),
  showPracticeFirst: z.boolean(),
  allowSkip: z.boolean(),
  skipButtonText: z.string(),
  instructionText: z.string(),
  highlightColor: z.string(),
})

export const annotationSchema = z.object({
  textId: z.string().min(1),
  selectedText: z.string(),
  startIndex: z.number().min(0),
  endIndex: z.number().min(0),
  followUpAnswers: z.record(z.string(), z.union([z.string(), z.number(), z.null()])),
  skipped: z.boolean(),
})

export const annotateRequestSchema = z.object({
  sessionToken: z.string().min(1),
  articleId: z.string().min(1),
  selectedText: z.string(),
  startIndex: z.number().min(0),
  endIndex: z.number().min(0),
  followUpAnswers: z.string(),
  skipped: z.boolean(),
})

export type FollowUpOptionInput = z.infer<typeof followUpOptionSchema>
export type FollowUpQuestionInput = z.infer<typeof followUpQuestionSchema>
export type TextItemInput = z.infer<typeof textItemSchema>
export type TextAnnotationSettingsInput = z.infer<typeof textAnnotationSettingsSchema>
export type AnnotationInput = z.infer<typeof annotationSchema>
export type AnnotateRequestInput = z.infer<typeof annotateRequestSchema>
