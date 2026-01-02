import type { Annotation } from "@/features/annotation";

import { useCallback } from "react";

import { apiPost } from "@/lib/api";

interface CompleteSessionResponse {
  success: boolean;
  returnUrl?: string | null;
}

export const useAnnotationApi = (
  sessionToken: string | undefined,
  formId: string | undefined
) => {
  // Save annotation to API
  const saveAnnotationToApi = useCallback(
    async (annotation: Annotation, articleId: string) => {
      if (!sessionToken || !formId) return;

      const { error } = await apiPost(`/api/forms/${formId}/session/annotate`, {
        sessionToken,
        articleId,
        // Multi-selection support (new)
        selections: annotation.selections,
        // Legacy single-selection fields (for backward compatibility)
        selectedText: annotation.selectedText,
        startIndex: annotation.startIndex,
        endIndex: annotation.endIndex,
        // Send follow-up answers as JSON string
        followUpAnswers: JSON.stringify(annotation.followUpAnswers),
        skipped: annotation.skipped,
      });

      if (error) {
        console.error("Failed to save annotation:", error);
      }
    },
    [sessionToken, formId]
  );

  // Complete session via API - returns the redirect URL if configured
  const completeSession = useCallback(async (): Promise<string | null> => {
    if (!sessionToken || !formId) return null;

    const { data, error } = await apiPost<CompleteSessionResponse>(
      `/api/forms/${formId}/session/complete`,
      { sessionToken }
    );

    if (error) {
      console.error("Failed to complete session:", error);
      return null;
    }

    return data?.returnUrl ?? null;
  }, [sessionToken, formId]);

  return {
    saveAnnotationToApi,
    completeSession,
  };
};
