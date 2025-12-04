"use client";

import type { FormData } from "../types";

import { useEffect, useState } from "react";

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
      try {
        const res = await fetch(`/api/forms/public/${slug}`);
        if (res.ok) {
          const data = await res.json();
          // Sort questions in correct logical order for form flow
          const sortedQuestions = sortQuestionsForFlow(data.questions);
          setForm({ ...data, questions: sortedQuestions });
        } else {
          const errorData = await res.json();
          setError(errorData.error || "Form not found");
        }
      } catch (err) {
        console.error("Failed to fetch form:", err);
        setError("Failed to load form");
      } finally {
        setIsLoading(false);
      }
    };

    fetchForm();
  }, [slug]);

  return { form, isLoading, error };
};
