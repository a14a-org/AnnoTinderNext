"use client";

import type { FormData } from "../types";

import { useEffect, useState } from "react";

import { apiGet } from "@/lib/api";

import { sortQuestionsForFlow } from "../utils";

interface UseFormDataResult {
  form: FormData | null;
  isLoading: boolean;
  error: string | null;
}

export const useFormData = (slug: string): UseFormDataResult => {
  const [form, setForm] = useState<FormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForm = async () => {
      const { data, error: fetchError } = await apiGet<FormData>(
        `/api/forms/public/${slug}`
      );

      if (data) {
        // Sort questions in correct logical order for form flow
        const sortedQuestions = sortQuestionsForFlow(data.questions);
        setForm({ ...data, questions: sortedQuestions });
      } else {
        console.error("Failed to fetch form:", fetchError);
        setError(fetchError || "Form not found");
      }
      setIsLoading(false);
    };

    fetchForm();
  }, [slug]);

  return { form, isLoading, error };
};
