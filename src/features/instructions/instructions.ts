/**
 * Instructions Question Type
 *
 * A staple screen type for displaying detailed instructions to participants
 * before they begin an annotation task. Supports full markdown formatting
 * including headers, bold, italic, lists, and more.
 */

export interface InstructionsSettings {
  /** The markdown content to display */
  content: string
  /** Custom title override (defaults to question title) */
  title?: string
  /** Text for the continue button */
  buttonText?: string
  /** Whether to show a confirmation checkbox */
  showCheckbox?: boolean
  /** Label for the confirmation checkbox */
  checkboxLabel?: string
}

export const DEFAULT_INSTRUCTIONS_SETTINGS: InstructionsSettings = {
  content: `## Instructies

Lees de onderstaande instructies zorgvuldig door voordat u begint.

### Wat wordt er van u verwacht?

- Lees elk artikel aandachtig door
- Volg de aanwijzingen op het scherm
- Neem de tijd om uw antwoorden te overwegen

### Tips

**Let op:** Zorg ervoor dat u in een rustige omgeving werkt waar u zich kunt concentreren.

*Als u vragen heeft, neem dan contact op met de onderzoeker.*`,
  title: undefined,
  buttonText: 'Ik heb de instructies gelezen',
  showCheckbox: true,
  checkboxLabel: 'Ik heb de instructies gelezen en begrepen',
}

/**
 * Parse settings from question settings JSON
 */
export const parseInstructionsSettings = (
  settingsJson: Record<string, unknown> | null
): InstructionsSettings => {
  if (!settingsJson) {
    return DEFAULT_INSTRUCTIONS_SETTINGS
  }

  return {
    ...DEFAULT_INSTRUCTIONS_SETTINGS,
    ...settingsJson,
  } as InstructionsSettings
}
