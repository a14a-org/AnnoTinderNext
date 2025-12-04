export {
  classifyDemographic,
  validateDemographics,
  DEFAULT_DEMOGRAPHICS_SETTINGS,
} from './demographics'
export type {
  DemographicField,
  DemographicsSettings,
  DemographicAnswers,
} from './demographics'

export {
  demographicFieldSchema,
  demographicsSettingsSchema,
  demographicAnswersSchema,
} from './schemas/demographics.schema'
export type {
  DemographicFieldInput,
  DemographicsSettingsInput,
  DemographicAnswersInput,
} from './schemas/demographics.schema'

export { DemographicsDisplay } from './components/demographics-display'
export type { DemographicsDisplayProps } from './components/demographics-display'
export { DemographicsEditor } from './components/demographics-editor'
export type { DemographicsEditorProps } from './components/demographics-editor'
