"use client";

import { useEffect, useRef, useState } from "react";

type SaveStatus = "idle" | "saving" | "saved";

interface UseAutoSaveOptions<T> {
  value: T;
  onSave: (value: T) => void | Promise<void>;
  delay?: number;
  enabled?: boolean;
}

export const useAutoSave = <T>({
  value,
  onSave,
  delay = 1000,
  enabled = true,
}: UseAutoSaveOptions<T>) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);

  // Skip initial save
  useEffect(() => {
    const timer = setTimeout(() => {
      initialLoadRef.current = false;
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Auto-save effect
  useEffect(() => {
    if (!enabled || initialLoadRef.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      await onSave(value);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, delay);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [value, onSave, delay, enabled]);

  return { saveStatus };
};
