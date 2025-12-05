"use client";

import type { Question, QuestionUpdatePayload, InformedConsentSettings, TextAnnotationSettings, DemographicsSettings } from "../../types";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Trash2 } from "lucide-react";

import { Input } from "@/components/ui";
import { InformedConsentEditor } from "@/components/molecules/InformedConsentEditor";
import { AnnotationEditor } from "@/components/molecules/AnnotationEditor";
import { DemographicsEditor } from "@/features/demographics";
import { DEFAULT_CONSENT_SETTINGS } from "@/features/informed-consent";
import { DEFAULT_ANNOTATION_SETTINGS } from "@/features/annotation";
import { DEFAULT_DEMOGRAPHICS_SETTINGS } from "@/features/demographics";

import { isChoiceType } from "../../constants";

interface QuestionEditorProps {
  question: Question;
  onUpdate: (updates: QuestionUpdatePayload) => void;
  onDelete: () => void;
  articleCount?: number;
  articlesPerSession?: number;
}

export const QuestionEditor = ({
  question,
  onUpdate,
  onDelete,
  articleCount = 0,
  articlesPerSession = 20,
}: QuestionEditorProps) => {
  const [title, setTitle] = useState(question.title);
  const [description, setDescription] = useState(question.description || "");
  const [placeholder, setPlaceholder] = useState(question.placeholder || "");
  const [isRequired, setIsRequired] = useState(question.isRequired);
  const [options, setOptions] = useState(question.options);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for inputs to check focus before syncing
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const placeholderInputRef = useRef<HTMLInputElement>(null);

  // Sync state with props, but only if the input is NOT focused
  useEffect(() => {
    if (document.activeElement !== titleInputRef.current) {
      setTitle(question.title);
    }
  }, [question.title]);

  useEffect(() => {
    if (document.activeElement !== descriptionInputRef.current) {
      setDescription(question.description || "");
    }
  }, [question.description]);

  useEffect(() => {
    if (document.activeElement !== placeholderInputRef.current) {
      setPlaceholder(question.placeholder || "");
    }
  }, [question.placeholder]);

  useEffect(() => {
    setIsRequired(question.isRequired);
  }, [question.isRequired]);

  useEffect(() => {
    setOptions(question.options);
  }, [question.options]);

  // Helper to trigger updates
  const triggerUpdate = (updates: Partial<QuestionUpdatePayload>) => {
    // Immediately propagate changes to parent (optimistic update)
    onUpdate({
      title,
      description: description || null,
      placeholder: placeholder || null,
      isRequired,
      options: isChoiceType(question.type)
        ? options.map((o) => ({ label: o.label, value: o.value }))
        : undefined,
      ...updates, // Override with new values
    });

    // Manage UI feedback "Saving..." -> "Saved"
    setSaveStatus("saving");
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 1000);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    triggerUpdate({ title: val });
  };

  const handleDescriptionChange = (val: string) => {
    setDescription(val);
    triggerUpdate({ description: val || null });
  };

  const handlePlaceholderChange = (val: string) => {
    setPlaceholder(val);
    triggerUpdate({ placeholder: val || null });
  };

  const handleRequiredChange = (val: boolean) => {
    setIsRequired(val);
    triggerUpdate({ isRequired: val });
  };

  const handleOptionsChange = (newOptions: typeof options) => {
    setOptions(newOptions);
    triggerUpdate({ 
      options: newOptions.map((o) => ({ label: o.label, value: o.value })) 
    });
  };

  const isScreen = question.type === "WELCOME_SCREEN" || question.type === "THANK_YOU_SCREEN" || question.type === "INFORMED_CONSENT" || question.type === "DEMOGRAPHICS";
  const isWelcome = question.type === "WELCOME_SCREEN";
  const isInformedConsent = question.type === "INFORMED_CONSENT";
  const isTextAnnotation = question.type === "TEXT_ANNOTATION";
  const isDemographics = question.type === "DEMOGRAPHICS";

  const handleConsentSettingsUpdate = (consentSettings: InformedConsentSettings) => {
    triggerUpdate({
      settings: consentSettings as unknown as Record<string, unknown>,
    });
  };

  const handleAnnotationSettingsUpdate = (annotationSettings: TextAnnotationSettings) => {
    triggerUpdate({
      settings: annotationSettings as unknown as Record<string, unknown>,
    });
  };

  const handleDemographicsSettingsUpdate = (demographicsSettings: DemographicsSettings) => {
    triggerUpdate({
      settings: demographicsSettings as unknown as Record<string, unknown>,
    });
  };

  const getTitlePlaceholder = () => {
    if (isWelcome) return "Add a title for your welcome screen";
    if (isScreen) return "Heading text";
    return "Your question here";
  };

  const getDescriptionPlaceholder = () => {
    if (isWelcome) return "Please take a moment to fill out this form.";
    return "Optional helper text";
  };

  // Special editor for Informed Consent
  if (isInformedConsent) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <div>
          <label className="block text-sm font-medium text-obsidian mb-1">Consent Title</label>
          <Input 
            ref={titleInputRef}
            value={title} 
            onChange={(e) => handleTitleChange(e.target.value)} 
            placeholder="Informed Consent" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-obsidian mb-1">Introduction Text</label>
          <textarea
            ref={descriptionInputRef}
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Brief introduction to the consent form"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-chili-coral text-sm"
            rows={2}
          />
        </div>
        <InformedConsentEditor
          settings={(question.settings as unknown as InformedConsentSettings) || DEFAULT_CONSENT_SETTINGS}
          onUpdate={handleConsentSettingsUpdate}
        />
      </div>
    );
  }

  // Special editor for Text Annotation
  if (isTextAnnotation) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-obsidian">Edit Annotation</h3>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-obsidian mb-1">Question Title</label>
          <Input 
            ref={titleInputRef}
            value={title} 
            onChange={(e) => handleTitleChange(e.target.value)} 
            placeholder="Text Annotation" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-obsidian mb-1">Description</label>
          <textarea
            ref={descriptionInputRef}
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Instructions for the annotation task"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-chili-coral text-sm"
            rows={2}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="annotation-required"
            checked={isRequired}
            onChange={(e) => handleRequiredChange(e.target.checked)}
            className="rounded border-gray-300 text-chili-coral focus:ring-chili-coral"
          />
          <label htmlFor="annotation-required" className="text-sm text-obsidian">Required</label>
        </div>
        <AnnotationEditor
          settings={(question.settings as unknown as TextAnnotationSettings) || DEFAULT_ANNOTATION_SETTINGS}
          onUpdate={handleAnnotationSettingsUpdate}
          articleCount={articleCount}
          articlesPerSession={articlesPerSession}
        />
      </div>
    );
  }

  // Special editor for Demographics
  if (isDemographics) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-obsidian">Edit Demographics</h3>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-obsidian mb-1">Section Title</label>
          <Input 
            ref={titleInputRef}
            value={title} 
            onChange={(e) => handleTitleChange(e.target.value)} 
            placeholder="Demographics" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-obsidian mb-1">Description</label>
          <textarea
            ref={descriptionInputRef}
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Brief introduction to the demographics section"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-chili-coral text-sm"
            rows={2}
          />
        </div>
        <DemographicsEditor
          settings={(question.settings as unknown as DemographicsSettings) || DEFAULT_DEMOGRAPHICS_SETTINGS}
          onUpdate={handleDemographicsSettingsUpdate}
        />
      </div>
    );
  }

  // Standard question editor
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 sticky top-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-obsidian">Edit Question</h3>
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Loader2 className="w-3 h-3 animate-spin" />Saving...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <Check className="w-3 h-3" />Saved
            </span>
          )}
        </div>
        {!isScreen && (
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-obsidian mb-1">
          {isWelcome ? "Edit Title" : isScreen ? "Heading" : "Question"}
        </label>
        <Input
          ref={titleInputRef}
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder={getTitlePlaceholder()}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-obsidian mb-1">Description</label>
        <textarea
          ref={descriptionInputRef}
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder={getDescriptionPlaceholder()}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-chili-coral text-sm"
          rows={2}
        />
      </div>

          {!isScreen && (
        <>
          {["SHORT_TEXT", "LONG_TEXT", "EMAIL", "NUMBER"].includes(question.type) && (
            <div>
              <label className="block text-sm font-medium text-obsidian mb-1">Placeholder</label>
              <Input 
                ref={placeholderInputRef}
                value={placeholder} 
                onChange={(e) => handlePlaceholderChange(e.target.value)} 
                placeholder="Placeholder text" 
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="required"
              checked={isRequired}
              onChange={(e) => handleRequiredChange(e.target.checked)}
              className="rounded border-gray-300 text-chili-coral focus:ring-chili-coral"
            />
            <label htmlFor="required" className="text-sm text-obsidian">Required</label>
          </div>

          {isChoiceType(question.type) && (
            <div>
              <label className="block text-sm font-medium text-obsidian mb-2">Options</label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <Input
                      value={option.label}
                      onChange={(e) => {
                        const newOptions = [...options];
                        newOptions[index] = { ...option, label: e.target.value, value: e.target.value };
                        handleOptionsChange(newOptions);
                      }}
                      className="flex-1"
                    />
                    <button
                      onClick={() => {
                        const newOptions = options.filter((_, i) => i !== index);
                        handleOptionsChange(newOptions);
                      }}
                      className="p-1 hover:bg-gray-100 rounded text-gray-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newOptions = [
                      ...options,
                      { id: `new-${Date.now()}`, label: `Option ${options.length + 1}`, value: `Option ${options.length + 1}`, displayOrder: options.length },
                    ];
                    handleOptionsChange(newOptions);
                  }}
                  className="text-sm text-chili-coral hover:underline"
                >
                  + Add option
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
