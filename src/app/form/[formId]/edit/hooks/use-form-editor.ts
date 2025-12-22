"use client";

import type { Form, QuotaSettings } from "../types";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { apiGet, apiPut } from "@/lib/api";
import { DEFAULT_BRAND_COLOR } from "@/config/theme";

import { DEFAULT_QUOTA_SETTINGS } from "../constants";

interface UseFormEditorResult {
  form: Form | null;
  isLoading: boolean;
  title: string;
  description: string;
  brandColor: string;
  isPublished: boolean;
  articlesPerSession: number;
  sessionTimeoutMins: number;
  quotaSettings: QuotaSettings;
  dynataEnabled: boolean;
  dynataReturnUrl: string;
  dynataBasicCode: string;
  assignmentStrategy: "INDIVIDUAL" | "JOB_SET";
  saveStatus: "idle" | "saving" | "saved";
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setBrandColor: (color: string) => void;
  setIsPublished: (published: boolean) => void;
  setArticlesPerSession: (count: number) => void;
  setSessionTimeoutMins: (mins: number) => void;
  setQuotaSettings: (settings: QuotaSettings) => void;
  setDynataEnabled: (enabled: boolean) => void;
  setDynataReturnUrl: (url: string) => void;
  setDynataBasicCode: (code: string) => void;
  setAssignmentStrategy: (strategy: "INDIVIDUAL" | "JOB_SET") => void;
  setForm: React.Dispatch<React.SetStateAction<Form | null>>;
  fetchForm: () => Promise<void>;
  togglePublish: () => Promise<void>;
}

export const useFormEditor = (formId: string): UseFormEditorResult => {
  const router = useRouter();

  const [form, setForm] = useState<Form | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [brandColor, setBrandColor] = useState(DEFAULT_BRAND_COLOR);
  const [isPublished, setIsPublished] = useState(false);
  const [articlesPerSession, setArticlesPerSession] = useState(20);
  const [sessionTimeoutMins, setSessionTimeoutMins] = useState(10);
  const [quotaSettings, setQuotaSettings] = useState<QuotaSettings>(DEFAULT_QUOTA_SETTINGS);
  const [dynataEnabled, setDynataEnabled] = useState(false);
  const [dynataReturnUrl, setDynataReturnUrl] = useState("");
  const [dynataBasicCode, setDynataBasicCode] = useState("");
  const [assignmentStrategy, setAssignmentStrategy] = useState<"INDIVIDUAL" | "JOB_SET">("INDIVIDUAL");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);

  const fetchForm = useCallback(async () => {
    const { data, error } = await apiGet<Form>(`/api/forms/${formId}`);

    if (data) {
      setForm(data);
      setTitle(data.title);
      setDescription(data.description || "");
      setBrandColor(data.brandColor || DEFAULT_BRAND_COLOR);
      setIsPublished(data.isPublished);
      setArticlesPerSession(data.articlesPerSession ?? 20);
      setSessionTimeoutMins(data.sessionTimeoutMins ?? 10);
      if (data.quotaSettings) {
        const parsed = typeof data.quotaSettings === 'string' ? JSON.parse(data.quotaSettings) : data.quotaSettings;
        setQuotaSettings(parsed);
      }
      setDynataEnabled(data.dynataEnabled ?? false);
      setDynataReturnUrl(data.dynataReturnUrl ?? "");
      setDynataBasicCode(data.dynataBasicCode ?? "");
      setAssignmentStrategy(data.assignmentStrategy || "INDIVIDUAL");
      setTimeout(() => { initialLoadRef.current = false; }, 100);
    } else {
      console.error("Failed to fetch form:", error);
      router.push("/");
    }
    setIsLoading(false);
  }, [formId, router]);

  const saveFormSettings = useCallback(async () => {
    setSaveStatus("saving");

    const { data, error } = await apiPut<Form>(`/api/forms/${formId}`, {
      title, description, brandColor, isPublished,
      articlesPerSession, sessionTimeoutMins, quotaSettings,
      dynataEnabled, dynataReturnUrl: dynataReturnUrl || null, dynataBasicCode: dynataBasicCode || null,
      assignmentStrategy,
    });

    if (data) {
      setForm((prev) => (prev ? { ...data, _count: prev._count } : data));
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } else {
      console.error("Failed to save form:", error);
      setSaveStatus("idle");
    }
  }, [formId, title, description, brandColor, isPublished, articlesPerSession, sessionTimeoutMins, quotaSettings, dynataEnabled, dynataReturnUrl, dynataBasicCode, assignmentStrategy]);

  useEffect(() => {
    let cancelled = false;

    const loadForm = async () => {
      const { data, error } = await apiGet<Form>(`/api/forms/${formId}`);
      if (cancelled) return;

      if (data) {
        setForm(data);
        setTitle(data.title);
        setDescription(data.description || "");
        setBrandColor(data.brandColor || DEFAULT_BRAND_COLOR);
        setIsPublished(data.isPublished);
        setArticlesPerSession(data.articlesPerSession ?? 20);
        setSessionTimeoutMins(data.sessionTimeoutMins ?? 10);
        if (data.quotaSettings) {
          const parsed = typeof data.quotaSettings === 'string' ? JSON.parse(data.quotaSettings) : data.quotaSettings;
          setQuotaSettings(parsed);
        }
        setDynataEnabled(data.dynataEnabled ?? false);
        setDynataReturnUrl(data.dynataReturnUrl ?? "");
        setDynataBasicCode(data.dynataBasicCode ?? "");
        setAssignmentStrategy(data.assignmentStrategy || "INDIVIDUAL");
        setTimeout(() => { initialLoadRef.current = false; }, 100);
      } else {
        console.error("Failed to fetch form:", error);
        router.push("/");
      }
      setIsLoading(false);
    };

    loadForm();
    return () => { cancelled = true; };
  }, [formId, router]);

  useEffect(() => {
    if (initialLoadRef.current) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => { saveFormSettings(); }, 1000);

    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [title, description, brandColor, articlesPerSession, sessionTimeoutMins, quotaSettings, dynataEnabled, dynataReturnUrl, dynataBasicCode, assignmentStrategy, saveFormSettings]);

  const togglePublish = useCallback(async () => {
    const newStatus = !isPublished;
    setIsPublished(newStatus);

    const { error } = await apiPut(`/api/forms/${formId}`, { isPublished: newStatus });

    if (error) {
      console.error("Failed to toggle publish:", error);
      setIsPublished(!newStatus);
    } else {
      await fetchForm();
    }
  }, [formId, isPublished, fetchForm]);

  return {
    form, isLoading, title, description, brandColor, isPublished,
    articlesPerSession, sessionTimeoutMins, quotaSettings,
    dynataEnabled, dynataReturnUrl, dynataBasicCode, assignmentStrategy, saveStatus,
    setTitle, setDescription, setBrandColor, setIsPublished,
    setArticlesPerSession, setSessionTimeoutMins, setQuotaSettings,
    setDynataEnabled, setDynataReturnUrl, setDynataBasicCode, setAssignmentStrategy,
    setForm, fetchForm, togglePublish,
  };
};
