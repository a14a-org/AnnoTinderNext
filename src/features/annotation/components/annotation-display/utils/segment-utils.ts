import type { SelectionMode, TextItem } from "@/features/annotation";
import { splitIntoSentences, splitIntoWords } from "@/features/annotation";

export const splitIntoSegments = (
  text: TextItem | undefined,
  selectionMode: SelectionMode
): string[] => {
  if (!text) return [];
  return selectionMode === "sentence"
    ? splitIntoSentences(text.text)
    : splitIntoWords(text.text);
};
