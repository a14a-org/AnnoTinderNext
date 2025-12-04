/**
 * Informed Consent Types and Default Templates
 * Based on standard Dutch research consent forms
 */

export interface ConsentCheckbox {
  id: string
  label: string
  required: boolean
}

export interface CustomSection {
  title: string
  content: string
}

export interface InformedConsentSettings {
  researchTitle: string
  researchers: string[]
  contactEmail: string
  contactPerson: string
  estimatedDuration: string
  compensation: string | undefined
  contentWarnings: string[] | undefined
  dataCollected: string[]
  dataProcessor: string
  dataRetentionPeriod: string
  minimumAge: number
  customSections: CustomSection[] | undefined
  agreeButtonText: string | undefined
  declineButtonText: string | undefined
  declineTitle: string | undefined
  declineMessage: string | undefined
  consentCheckboxes: ConsentCheckbox[] | undefined
}

export const DEFAULT_CONSENT_SETTINGS: InformedConsentSettings = {
  researchTitle: 'Onderzoekstitel',
  researchers: ['Onderzoeksinstelling'],
  contactEmail: 'onderzoek@voorbeeld.nl',
  contactPerson: 'Naam Onderzoeker',
  estimatedDuration: '15 minuten',
  compensation: undefined,
  contentWarnings: undefined,
  minimumAge: 16,
  dataCollected: ['gender', 'leeftijd', 'onderwijsniveau'],
  dataProcessor: 'Onderzoeksinstelling',
  dataRetentionPeriod: '10 jaar',
  customSections: undefined,
  agreeButtonText: 'Ik ga akkoord',
  declineButtonText: 'Niet deelnemen',
  declineTitle: 'Bedankt voor uw interesse',
  declineMessage:
    'U heeft aangegeven niet deel te willen nemen aan dit onderzoek. Uw gegevens worden niet opgeslagen. U kunt dit venster nu sluiten.',
  consentCheckboxes: [
    {
      id: 'read_understood',
      label: 'Ik heb bovenstaande informatie gelezen en begrepen',
      required: true,
    },
    {
      id: 'age_confirmation',
      label: 'Ik ben 16 jaar of ouder',
      required: true,
    },
  ],
}

export const CONSENT_SECTIONS = {
  purpose: {
    title: 'Waarom doen we dit onderzoek?',
    template:
      'Dit onderzoek wordt uitgevoerd door {{researchers}}. Het doel van dit onderzoek is om meer inzicht te krijgen in [onderzoeksdoel].',
  },
  procedure: {
    title: 'Wat gebeurt er tijdens mijn deelname?',
    template:
      'Deelname aan dit onderzoek duurt ongeveer {{estimatedDuration}}. Tijdens het onderzoek zult u [beschrijving procedure].',
  },
  voluntary: {
    title: 'Is mijn deelname vrijwillig?',
    template:
      'Ja, deelname aan dit onderzoek is geheel vrijwillig. U kunt op elk moment stoppen zonder opgaaf van reden. Uw gegevens worden dan niet opgeslagen.',
  },
  dataHandling: {
    title: 'Wat gebeurt er met mijn gegevens?',
    template:
      'We verzamelen de volgende gegevens: {{dataCollected}}. Uw gegevens worden vertrouwelijk behandeld en verwerkt door {{dataProcessor}}.',
  },
  retention: {
    title: 'Hoe lang worden mijn gegevens bewaard?',
    template:
      'Uw gegevens worden {{dataRetentionPeriod}} bewaard, waarna ze worden verwijderd.',
  },
  contact: {
    title: 'Aanvullende informatie',
    template:
      'Als u vragen heeft over dit onderzoek, kunt u contact opnemen met {{contactPerson}} via {{contactEmail}}.',
  },
} as const

/**
 * Generates the full consent text from settings
 */
export const generateConsentText = (
  settings: InformedConsentSettings
): string => {
  const sections: string[] = []

  // Purpose section
  const purposeText = settings.researchTitle
    ? `Dit onderzoek "${settings.researchTitle}" wordt uitgevoerd door ${settings.researchers.join(', ')}.`
    : CONSENT_SECTIONS.purpose.template.replace(
        '{{researchers}}',
        settings.researchers.join(', ')
      )
  sections.push(`## ${CONSENT_SECTIONS.purpose.title}\n\n${purposeText}`)

  // Procedure section
  const compensationText = settings.compensation
    ? ` Als dank voor uw deelname ontvangt u ${settings.compensation}.`
    : ''
  sections.push(
    `## ${CONSENT_SECTIONS.procedure.title}\n\nDeelname aan dit onderzoek duurt ongeveer ${settings.estimatedDuration}.${compensationText}`
  )

  // Content warnings if present
  if (settings.contentWarnings && settings.contentWarnings.length > 0) {
    sections.push(
      `## Let op\n\nDit onderzoek bevat mogelijk: ${settings.contentWarnings.join(', ')}. Als u hier moeite mee heeft, kunt u ervoor kiezen om niet deel te nemen.`
    )
  }

  // Voluntary participation
  sections.push(
    `## ${CONSENT_SECTIONS.voluntary.title}\n\n${CONSENT_SECTIONS.voluntary.template}`
  )

  // Data handling
  const dataList = settings.dataCollected.join(', ')
  sections.push(
    `## ${CONSENT_SECTIONS.dataHandling.title}\n\nWe verzamelen de volgende gegevens: ${dataList}. Uw gegevens worden vertrouwelijk behandeld en verwerkt door ${settings.dataProcessor}.`
  )

  // Retention
  sections.push(
    `## ${CONSENT_SECTIONS.retention.title}\n\nUw gegevens worden ${settings.dataRetentionPeriod} bewaard, waarna ze worden verwijderd.`
  )

  // Custom sections
  if (settings.customSections) {
    const customSectionTexts = settings.customSections.map(
      (section) => `## ${section.title}\n\n${section.content}`
    )
    sections.push(...customSectionTexts)
  }

  // Contact
  sections.push(
    `## ${CONSENT_SECTIONS.contact.title}\n\nAls u vragen heeft over dit onderzoek, kunt u contact opnemen met ${settings.contactPerson} via ${settings.contactEmail}.`
  )

  // Age requirement
  const agreeText = settings.agreeButtonText ?? 'Ja, ik ga akkoord'
  sections.push(
    `\n---\n\nDoor op "${agreeText}" te klikken, bevestigt u dat u minimaal ${settings.minimumAge} jaar oud bent en dat u akkoord gaat met deelname aan dit onderzoek.`
  )

  return sections.join('\n\n')
}

/**
 * Parse settings from question settings JSON
 */
export const parseConsentSettings = (
  settingsJson: Record<string, unknown> | null
) => {
  if (!settingsJson) {
    return DEFAULT_CONSENT_SETTINGS
  }

  return {
    ...DEFAULT_CONSENT_SETTINGS,
    ...settingsJson,
  } as InformedConsentSettings
}
