import { z } from 'zod'

export const instructionsSettingsSchema = z.object({
  content: z.string().min(1, 'Instructions content is required'),
  title: z.string().optional(),
  buttonText: z.string().optional(),
  showCheckbox: z.boolean().optional(),
  checkboxLabel: z.string().optional(),
})

export type InstructionsSettingsInput = z.infer<typeof instructionsSettingsSchema>
