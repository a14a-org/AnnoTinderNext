/**
 * Text Annotation Question Type
 *
 * Allows participants to annotate text passages by selecting words or sentences.
 * Each text can have multiple follow-up questions (multiple choice, open text, or rating scale).
 */

export type SelectionMode = 'word' | 'sentence'

export type FollowUpType = 'multiple_choice' | 'open_text' | 'rating_scale'

export interface FollowUpOption {
  label: string
  value: string
}

export interface FollowUpQuestion {
  id: string
  type: FollowUpType
  question: string
  isRequired: boolean
  options: FollowUpOption[] | undefined
  placeholder: string | undefined
  minRating: number | undefined
  maxRating: number | undefined
  minLabel: string | undefined
  maxLabel: string | undefined
}

/** @deprecated Use FollowUpQuestion instead */
export interface FollowUpConfig {
  type: FollowUpType
  question: string
  options: FollowUpOption[] | undefined
  placeholder: string | undefined
  minRating: number | undefined
  maxRating: number | undefined
  minLabel: string | undefined
  maxLabel: string | undefined
}

export interface TextItem {
  id: string
  text: string
  metadata: Record<string, string> | undefined
}

export type TextSource = 'manual' | 'database'

export interface TextAnnotationSettings {
  selectionMode: SelectionMode
  /** @deprecated Use followUpQuestions instead */
  followUp: FollowUpConfig | undefined
  followUpQuestions: FollowUpQuestion[]
  textSource: TextSource
  texts: TextItem[]
  practiceTexts: TextItem[]
  showPracticeFirst: boolean
  allowSkip: boolean
  skipButtonText: string
  instructionText: string
  highlightColor: string
}

export const DEFAULT_ANNOTATION_SETTINGS: TextAnnotationSettings = {
  selectionMode: 'sentence',
  followUp: undefined,
  followUpQuestions: [
    {
      id: 'default-q1',
      type: 'multiple_choice',
      question: 'Waarom heb je deze passage geselecteerd?',
      isRequired: true,
      options: [
        { label: 'Interessant', value: 'interesting' },
        { label: 'Verwarrend', value: 'confusing' },
        { label: 'Belangrijk', value: 'important' },
        { label: 'Oneens', value: 'disagree' },
      ],
      placeholder: undefined,
      minRating: undefined,
      maxRating: undefined,
      minLabel: undefined,
      maxLabel: undefined,
    },
  ],
  textSource: 'database',
  texts: [],
  practiceTexts: [],
  showPracticeFirst: false,
  allowSkip: true,
  skipButtonText: 'Overslaan',
  instructionText: 'Selecteer een passage in de tekst hieronder',
  highlightColor: '#fef08a',
}

export interface Annotation {
  textId: string
  selectedText: string
  startIndex: number
  endIndex: number
  followUpAnswers: Record<string, string | number | null>
  skipped: boolean
}

export interface AnnotationAnswer {
  annotations: Annotation[]
  currentTextIndex: number
  completed: boolean
}

/**
 * Parse a single CSV line, handling quoted values
 */
const parseCSVLine = (line: string): string[] => {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if ((char === ',' || char === ';') && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

/**
 * Parse CSV text into TextItem array
 * Expects first row to be headers, with at least a "text" column
 */
export const parseCSVToTexts = (csvContent: string) => {
  const lines = csvContent.trim().split('\n')
  if (lines.length < 2) return []

  const headers = parseCSVLine(lines[0])
  const textColumnIndex = headers.findIndex(
    (h) => h.toLowerCase() === 'text' || h.toLowerCase() === 'tekst'
  )

  if (textColumnIndex === -1) {
    return lines.slice(1).map((line, index) => {
      const values = parseCSVLine(line)
      return {
        id: `text-${index}`,
        text: values[0] ?? '',
        metadata: undefined,
      }
    })
  }

  return lines.slice(1).map((line, index) => {
    const values = parseCSVLine(line)
    const metadata = Object.fromEntries(
      headers
        .map((header, i) => [header, values[i]] as const)
        .filter(([, value], i) => i !== textColumnIndex && value)
    )

    const hasMetadata = Object.keys(metadata).length > 0

    return {
      id: `text-${index}`,
      text: values[textColumnIndex] ?? '',
      metadata: hasMetadata ? metadata : undefined,
    }
  })
}

/**
 * Split text into sentences for sentence selection mode
 */
export const splitIntoSentences = (text: string): string[] =>
  text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

/**
 * Split text into words for word selection mode
 */
export const splitIntoWords = (text: string): string[] =>
  text.split(/\s+/).filter((w) => w.length > 0)
