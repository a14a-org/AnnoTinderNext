import type { SelectionMode, TextItem } from "@/features/annotation";
import { splitIntoSentencesWithParagraphs, splitIntoWords } from "@/features/annotation";

export const splitIntoSegments = (
  text: TextItem | undefined,
  selectionMode: SelectionMode
): { segments: string[]; paragraphBreakIndices: Set<number> } => {
  if (!text) return { segments: [], paragraphBreakIndices: new Set() };
  if (selectionMode === "sentence") {
    return splitIntoSentencesWithParagraphs(text.text);
  }
  return { segments: splitIntoWords(text.text), paragraphBreakIndices: new Set() };
};
