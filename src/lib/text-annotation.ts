/**
 * Text Annotation Question Type
 *
 * Allows participants to annotate text passages by selecting words or sentences.
 * Each text can have multiple follow-up questions (multiple choice, open text, or rating scale).
 */

export type SelectionMode = "word" | "sentence";

export type FollowUpType = "multiple_choice" | "open_text" | "rating_scale";

export interface FollowUpOption {
  label: string;
  value: string;
}

export interface FollowUpQuestion {
  id: string;
  type: FollowUpType;
  question: string;
  isRequired: boolean;
  options?: FollowUpOption[]; // For multiple_choice
  placeholder?: string; // For open_text
  minRating?: number; // For rating_scale (default 1)
  maxRating?: number; // For rating_scale (default 5)
  minLabel?: string; // Label for min rating
  maxLabel?: string; // Label for max rating
}

/** @deprecated Use FollowUpQuestion instead */
export interface FollowUpConfig {
  type: FollowUpType;
  question: string;
  options?: FollowUpOption[]; // For multiple_choice
  placeholder?: string; // For open_text
  minRating?: number; // For rating_scale (default 1)
  maxRating?: number; // For rating_scale (default 5)
  minLabel?: string; // Label for min rating
  maxLabel?: string; // Label for max rating
}

export interface TextItem {
  id: string;
  text: string;
  metadata?: Record<string, string>; // Optional metadata from CSV columns
}

/** Source of texts for annotation */
export type TextSource = "manual" | "database";

export interface TextAnnotationSettings {
  selectionMode: SelectionMode;
  /** @deprecated Use followUpQuestions instead */
  followUp?: FollowUpConfig;
  /** Multiple follow-up questions shown after text selection */
  followUpQuestions: FollowUpQuestion[];
  /** Source of texts: "manual" uses texts array, "database" uses assigned articles */
  textSource: TextSource;
  /** Manual texts (used when textSource is "manual") */
  texts: TextItem[];
  /** Optional practice texts shown before main task (when textSource is "database") */
  practiceTexts: TextItem[];
  /** Whether to show practice texts before the main annotation task */
  showPracticeFirst: boolean;
  allowSkip: boolean;
  skipButtonText: string;
  instructionText: string;
  highlightColor: string;
}

export const DEFAULT_ANNOTATION_SETTINGS: TextAnnotationSettings = {
  selectionMode: "sentence",
  followUpQuestions: [
    {
      id: "default-q1",
      type: "multiple_choice",
      question: "Waarom heb je deze passage geselecteerd?",
      isRequired: true,
      options: [
        { label: "Interessant", value: "interesting" },
        { label: "Verwarrend", value: "confusing" },
        { label: "Belangrijk", value: "important" },
        { label: "Oneens", value: "disagree" },
      ],
    },
  ],
  textSource: "database", // Default to database for quota-based assignment
  texts: [],
  practiceTexts: [],
  showPracticeFirst: false,
  allowSkip: true,
  skipButtonText: "Overslaan",
  instructionText: "Selecteer een passage in de tekst hieronder",
  highlightColor: "#fef08a", // Yellow highlight
};

export interface Annotation {
  textId: string;
  selectedText: string;
  startIndex: number;
  endIndex: number;
  /** Answers keyed by follow-up question ID */
  followUpAnswers: Record<string, string | number | null>;
  skipped: boolean;
}

export interface AnnotationAnswer {
  annotations: Annotation[];
  currentTextIndex: number;
  completed: boolean;
}

/**
 * Parse CSV text into TextItem array
 * Expects first row to be headers, with at least a "text" column
 */
export function parseCSVToTexts(csvContent: string): TextItem[] {
  const lines = csvContent.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const textColumnIndex = headers.findIndex(
    (h) => h.toLowerCase() === "text" || h.toLowerCase() === "tekst"
  );

  if (textColumnIndex === -1) {
    // If no text column, use first column as text
    return lines.slice(1).map((line, index) => {
      const values = parseCSVLine(line);
      return {
        id: `text-${index}`,
        text: values[0] || "",
      };
    });
  }

  return lines.slice(1).map((line, index) => {
    const values = parseCSVLine(line);
    const metadata: Record<string, string> = {};

    headers.forEach((header, i) => {
      if (i !== textColumnIndex && values[i]) {
        metadata[header] = values[i];
      }
    });

    return {
      id: `text-${index}`,
      text: values[textColumnIndex] || "",
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    };
  });
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === "," || char === ";") && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Split text into sentences for sentence selection mode
 */
export function splitIntoSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by space or end of string
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Split text into words for word selection mode
 */
export function splitIntoWords(text: string): string[] {
  return text.split(/\s+/).filter((w) => w.length > 0);
}
