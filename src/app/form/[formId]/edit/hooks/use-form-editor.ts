"use client";

import type { Form, QuotaSettings } from "../types";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
  const [brandColor, setBrandColor] = useState("#FF5A5F");
  const [isPublished, setIsPublished] = useState(false);
  const [articlesPerSession, setArticlesPerSession] = useState(20);
  const [sessionTimeoutMins, setSessionTimeoutMins] = useState(10);
  const [quotaSettings, setQuotaSettings] = useState<QuotaSettings>(DEFAULT_QUOTA_SETTINGS);
  const [dynataEnabled, setDynataEnabled] = useState(false);
  const [dynataReturnUrl, setDynataReturnUrl] = useState("");
  const [dynataBasicCode, setDynataBasicCode] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);

  const fetchForm = useCallback(async () => {
    try {
      const res = await fetch(`/api/forms/${formId}`);
      if (res.ok) {
        const data = await res.json();
        setForm(data);
        setTitle(data.title);
        setDescription(data.description || "");
        setBrandColor(data.brandColor || "#FF5A5F");
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
        setTimeout(() => { initialLoadRef.current = false; }, 100);
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Failed to fetch form:", error);
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  }, [formId, router]);

  const saveFormSettings = useCallback(async () => {
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/forms/${formId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description, brandColor, isPublished,
          articlesPerSession, sessionTimeoutMins, quotaSettings,
          dynataEnabled, dynataReturnUrl: dynataReturnUrl || null, dynataBasicCode: dynataBasicCode || null,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setForm((prev) => (prev ? { ...updated, _count: prev._count } : updated));
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      }
    } catch (error) {
      console.error("Failed to save form:", error);
      setSaveStatus("idle");
    }
  }, [formId, title, description, brandColor, isPublished, articlesPerSession, sessionTimeoutMins, quotaSettings, dynataEnabled, dynataReturnUrl, dynataBasicCode]);

  useEffect(() => { fetchForm(); }, [fetchForm]);

  useEffect(() => {
    if (initialLoadRef.current) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => { saveFormSettings(); }, 1000);

    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [title, description, brandColor, articlesPerSession, sessionTimeoutMins, quotaSettings, dynataEnabled, dynataReturnUrl, dynataBasicCode, saveFormSettings]);

  const togglePublish = useCallback(async () => {
    const newStatus = !isPublished;
    setIsPublished(newStatus);

    try {
      await fetch(`/api/forms/${formId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: newStatus }),
      });
      await fetchForm();
    } catch (error) {
      console.error("Failed to toggle publish:", error);
      setIsPublished(!newStatus);
    }
  }, [formId, isPublished, fetchForm]);

  return {
    form, isLoading, title, description, brandColor, isPublished,
    articlesPerSession, sessionTimeoutMins, quotaSettings,
    dynataEnabled, dynataReturnUrl, dynataBasicCode, saveStatus,
    setTitle, setDescription, setBrandColor, setIsPublished,
    setArticlesPerSession, setSessionTimeoutMins, setQuotaSettings,
    setDynataEnabled, setDynataReturnUrl, setDynataBasicCode,
    setForm, fetchForm, togglePublish,
  };
};
