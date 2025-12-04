/**
 * Maps keyboard letters (a-z) to option indices (0-25)
 * Used for quick selection in multiple choice questions
 */
export const letterToIndex = (key: string): number | null => {
  const lowerKey = key.toLowerCase();
  if (lowerKey.length !== 1) return null;

  const charCode = lowerKey.charCodeAt(0);
  if (charCode >= 97 && charCode <= 122) {
    return charCode - 97; // 'a' = 0, 'b' = 1, etc.
  }
  return null;
};

/**
 * Maps number keys (1-9, 0) to indices (0-9)
 * 1 = 0, 2 = 1, ..., 9 = 8, 0 = 9
 */
export const numberToIndex = (key: string): number | null => {
  if (key === "0") return 9;
  const num = parseInt(key, 10);
  if (num >= 1 && num <= 9) return num - 1;
  return null;
};

/**
 * Gets index from keyboard event for option selection
 * Supports both letter keys (a-z) and number keys (1-0)
 */
export const getSelectionIndex = (key: string, maxOptions: number): number | null => {
  // Try letter first
  const letterIdx = letterToIndex(key);
  if (letterIdx !== null && letterIdx < maxOptions) {
    return letterIdx;
  }

  // Try number for first 10 options
  const numberIdx = numberToIndex(key);
  if (numberIdx !== null && numberIdx < maxOptions) {
    return numberIdx;
  }

  return null;
};

/**
 * Navigation key handlers
 */
export const isNavigationKey = (key: string): "next" | "prev" | null => {
  if (key === "ArrowRight" || key === "ArrowDown" || key === "Tab") return "next";
  if (key === "ArrowLeft" || key === "ArrowUp") return "prev";
  return null;
};

export const isSubmitKey = (key: string): boolean => {
  return key === "Enter";
};

export const isEscapeKey = (key: string): boolean => {
  return key === "Escape";
};
