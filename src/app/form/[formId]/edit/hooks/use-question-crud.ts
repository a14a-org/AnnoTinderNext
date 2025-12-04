"use client";

import type { Form, Question, QuestionUpdatePayload } from "../types";

import { useCallback } from "react";

import { DEFAULT_CONSENT_SETTINGS } from "@/features/informed-consent";
import { DEFAULT_ANNOTATION_SETTINGS } from "@/features/annotation";
import { DEFAULT_DEMOGRAPHICS_SETTINGS } from "@/features/demographics";

import { isChoiceType } from "../constants";

interface UseQuestionCrudOptions {
  formId: string;
  form: Form | null;
  setForm: React.Dispatch<React.SetStateAction<Form | null>>;
  fetchForm: () => Promise<void>;
  setSelectedQuestion: (id: string | null) => void;
  setShowAddMenu: (show: boolean) => void;
}

interface UseQuestionCrudResult {
  addQuestion: (type: string) => Promise<void>;
  updateQuestion: (questionId: string, updates: QuestionUpdatePayload) => Promise<void>;
  deleteQuestion: (questionId: string) => Promise<void>;
  handleReorder: (newOrder: Question[]) => Promise<void>;
}

export const useQuestionCrud = ({
  formId,
  form,
  setForm,
  fetchForm,
  setSelectedQuestion,
  setShowAddMenu,
}: UseQuestionCrudOptions): UseQuestionCrudResult => {

  const addQuestion = useCallback(async (type: string) => {
    try {
      const defaultOptions = isChoiceType(type)
        ? [{ label: "Option 1" }, { label: "Option 2" }, { label: "Option 3" }]
        : undefined;

      let defaultTitle = "Your question here";
      let defaultSettings = undefined;
      let insertAfter = undefined;

      if (type === "INFORMED_CONSENT") {
        defaultTitle = "Informed Consent";
        defaultSettings = DEFAULT_CONSENT_SETTINGS;
        const welcomeScreen = form?.questions.find((q) => q.type === "WELCOME_SCREEN");
        if (welcomeScreen) insertAfter = welcomeScreen.id;
      }

      if (type === "TEXT_ANNOTATION") {
        defaultTitle = "Text Annotation";
        defaultSettings = DEFAULT_ANNOTATION_SETTINGS;
      }

      if (type === "DEMOGRAPHICS") {
        defaultTitle = "Demographics";
        defaultSettings = DEFAULT_DEMOGRAPHICS_SETTINGS;
        const informedConsent = form?.questions.find((q) => q.type === "INFORMED_CONSENT");
        if (informedConsent) {
          insertAfter = informedConsent.id;
        } else {
          const welcomeScreen = form?.questions.find((q) => q.type === "WELCOME_SCREEN");
          if (welcomeScreen) insertAfter = welcomeScreen.id;
        }
      }

      const res = await fetch(`/api/forms/${formId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title: defaultTitle, isRequired: false, options: defaultOptions, settings: defaultSettings, insertAfter }),
      });

      if (res.ok) await fetchForm();
    } catch (error) {
      console.error("Failed to add question:", error);
    }
    setShowAddMenu(false);
  }, [form, formId, fetchForm, setShowAddMenu]);

  const updateQuestion = useCallback(async (questionId: string, updates: QuestionUpdatePayload) => {
    try {
      const res = await fetch(`/api/forms/${formId}/questions/${questionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const updatedQuestion = await res.json();
        setForm((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            questions: prev.questions.map((q) => q.id === questionId ? { ...q, ...updatedQuestion } : q),
          };
        });
      }
    } catch (error) {
      console.error("Failed to update question:", error);
    }
  }, [formId, setForm]);

  const deleteQuestion = useCallback(async (questionId: string) => {
    if (!confirm("Delete this question?")) return;

    try {
      const res = await fetch(`/api/forms/${formId}/questions/${questionId}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedQuestion(null);
        await fetchForm();
      }
    } catch (error) {
      console.error("Failed to delete question:", error);
    }
  }, [formId, fetchForm, setSelectedQuestion]);

  const handleReorder = useCallback(async (newOrder: Question[]) => {
    if (!form) return;

    const updatedQuestions = [
      ...(form.questions.filter((q) => q.type === "WELCOME_SCREEN") || []),
      ...(form.questions.filter((q) => q.type === "INFORMED_CONSENT") || []),
      ...newOrder,
      ...(form.questions.filter((q) => q.type === "THANK_YOU_SCREEN") || []),
    ];

    setForm({ ...form, questions: updatedQuestions });

    try {
      await fetch(`/api/forms/${formId}/questions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIds: newOrder.map((q) => q.id) }),
      });
    } catch (error) {
      console.error("Failed to reorder questions:", error);
      await fetchForm();
    }
  }, [form, formId, setForm, fetchForm]);

  return { addQuestion, updateQuestion, deleteQuestion, handleReorder };
};
