export {
  generateConsentText,
  parseConsentSettings,
  DEFAULT_CONSENT_SETTINGS,
  CONSENT_SECTIONS,
} from './informed-consent'
export type {
  InformedConsentSettings,
  ConsentCheckbox,
  CustomSection,
} from './informed-consent'

export {
  consentCheckboxSchema,
  customSectionSchema,
  informedConsentSettingsSchema,
} from './schemas/informed-consent.schema'
export type {
  ConsentCheckboxInput,
  CustomSectionInput,
  InformedConsentSettingsInput,
} from './schemas/informed-consent.schema'
