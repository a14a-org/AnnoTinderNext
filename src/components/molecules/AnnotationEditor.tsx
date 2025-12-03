"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/atoms/Input";
import {
  Loader2,
  Check,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Upload,
  AlertTriangle,
  Database,
  FileText,
  Info,
} from "lucide-react";
import {
  TextAnnotationSettings,
  DEFAULT_ANNOTATION_SETTINGS,
  parseCSVToTexts,
  SelectionMode,
  FollowUpType,
  FollowUpQuestion,
  TextItem,
} from "@/lib/text-annotation";

// Maximum texts to display in editor for performance
const MAX_DISPLAYED_TEXTS = 100;
const MAX_TEXTS_WARNING = 50;

interface AnnotationEditorProps {
  settings: TextAnnotationSettings | null;
  onUpdate: (settings: TextAnnotationSettings) => void;
  /** Number of articles loaded in the database (for display) */
  articleCount?: number;
  /** Articles per session setting */
  articlesPerSession?: number;
}

// Safely parse settings to avoid "too many properties" error
function safeParseSettings(initialSettings: TextAnnotationSettings | null): TextAnnotationSettings {
  try {
    // Handle null/undefined settings
    if (!initialSettings) {
      return { ...DEFAULT_ANNOTATION_SETTINGS };
    }

    // Extract only the specific properties we need, avoiding spread on large objects
    const texts = Array.isArray(initialSettings.texts)
      ? initialSettings.texts
      : DEFAULT_ANNOTATION_SETTINGS.texts;

    // Ensure practiceTexts is always an array (may be undefined in older settings)
    const practiceTexts = Array.isArray(initialSettings.practiceTexts)
      ? initialSettings.practiceTexts
      : [];

    // Handle followUpQuestions - migrate from old followUp if needed
    let followUpQuestions: FollowUpQuestion[] = [];
    if (Array.isArray(initialSettings.followUpQuestions) && initialSettings.followUpQuestions.length > 0) {
      followUpQuestions = initialSettings.followUpQuestions;
    } else if (initialSettings.followUp) {
      // Migrate from old single followUp to new array format
      followUpQuestions = [{
        id: "migrated-q1",
        type: initialSettings.followUp.type || "multiple_choice",
        question: initialSettings.followUp.question || "",
        isRequired: true,
        options: initialSettings.followUp.options,
        placeholder: initialSettings.followUp.placeholder,
        minLabel: initialSettings.followUp.minLabel,
        maxLabel: initialSettings.followUp.maxLabel,
      }];
    } else {
      followUpQuestions = DEFAULT_ANNOTATION_SETTINGS.followUpQuestions;
    }

    return {
      texts,
      practiceTexts,
      textSource: initialSettings?.textSource ?? DEFAULT_ANNOTATION_SETTINGS.textSource,
      showPracticeFirst: initialSettings?.showPracticeFirst ?? DEFAULT_ANNOTATION_SETTINGS.showPracticeFirst,
      selectionMode: initialSettings?.selectionMode ?? DEFAULT_ANNOTATION_SETTINGS.selectionMode,
      highlightColor: initialSettings?.highlightColor ?? DEFAULT_ANNOTATION_SETTINGS.highlightColor,
      instructionText: initialSettings?.instructionText ?? DEFAULT_ANNOTATION_SETTINGS.instructionText,
      allowSkip: initialSettings?.allowSkip ?? DEFAULT_ANNOTATION_SETTINGS.allowSkip,
      skipButtonText: initialSettings?.skipButtonText ?? DEFAULT_ANNOTATION_SETTINGS.skipButtonText,
      followUpQuestions,
    };
  } catch {
    console.warn("Failed to parse annotation settings, using defaults");
    return DEFAULT_ANNOTATION_SETTINGS;
  }
}

function SectionHeader({
  title,
  section,
  expanded,
  onToggle,
}: {
  title: string;
  section: string;
  expanded: boolean;
  onToggle: (section: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(section)}
      className="flex items-center justify-between w-full py-2 text-sm font-semibold text-obsidian hover:text-chili-coral transition-colors"
    >
      {title}
      {expanded ? (
        <ChevronUp className="w-4 h-4" />
      ) : (
        <ChevronDown className="w-4 h-4" />
      )}
    </button>
  );
}

export function AnnotationEditor({
  settings: initialSettings,
  onUpdate,
  articleCount = 0,
  articlesPerSession = 20,
}: AnnotationEditorProps) {
  // Use safe parsing to avoid "too many properties" error with large datasets
  const [settings, setSettings] = useState<TextAnnotationSettings>(() =>
    safeParseSettings(initialSettings)
  );

  // Pagination state for large text lists
  const [displayedTextsCount, setDisplayedTextsCount] = useState(MAX_DISPLAYED_TEXTS);

  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    texts: true,
    selection: false,
    followup: false,
    display: false,
  });

  const [csvInput, setCsvInput] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);
  const pendingSettingsRef = useRef<TextAnnotationSettings | null>(null);
  const onUpdateRef = useRef(onUpdate);

  // Keep onUpdate ref current
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      initialLoadRef.current = false;
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (initialLoadRef.current) return;

    // Track pending changes
    pendingSettingsRef.current = settings;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus("saving");
      onUpdateRef.current(settings);
      pendingSettingsRef.current = null; // Clear pending after save
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [settings]);

  // Save pending changes on unmount
  useEffect(() => {
    return () => {
      if (pendingSettingsRef.current && !initialLoadRef.current) {
        // Save immediately on unmount if there are pending changes
        onUpdateRef.current(pendingSettingsRef.current);
      }
    };
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateSetting = <K extends keyof TextAnnotationSettings>(
    key: K,
    value: TextAnnotationSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleCSVPaste = () => {
    if (!csvInput.trim()) return;
    const parsed = parseCSVToTexts(csvInput);
    if (parsed.length > 0) {
      setSettings((prev) => ({
        ...prev,
        texts: [...prev.texts, ...parsed],
      }));
      setCsvInput("");
    }
  };

  const addText = () => {
    const newText: TextItem = {
      id: `text-${Date.now()}`,
      text: "",
    };
    setSettings((prev) => ({
      ...prev,
      texts: [...prev.texts, newText],
    }));
  };

  const updateText = (index: number, text: string) => {
    setSettings((prev) => ({
      ...prev,
      texts: prev.texts.map((t, i) => (i === index ? { ...t, text } : t)),
    }));
  };

  const removeText = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      texts: prev.texts.filter((_, i) => i !== index),
    }));
  };

  // Practice text handlers
  const addPracticeText = () => {
    const newText: TextItem = {
      id: `practice-${Date.now()}`,
      text: "",
    };
    setSettings((prev) => ({
      ...prev,
      practiceTexts: [...prev.practiceTexts, newText],
    }));
  };

  const updatePracticeText = (index: number, text: string) => {
    setSettings((prev) => ({
      ...prev,
      practiceTexts: prev.practiceTexts.map((t, i) => (i === index ? { ...t, text } : t)),
    }));
  };

  const removePracticeText = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      practiceTexts: prev.practiceTexts.filter((_, i) => i !== index),
    }));
  };

  // Follow-up question handlers
  const addFollowUpQuestion = () => {
    const newQuestion: FollowUpQuestion = {
      id: `q-${Date.now()}`,
      type: "multiple_choice",
      question: "",
      isRequired: true,
      options: [{ label: "", value: "" }],
    };
    setSettings((prev) => ({
      ...prev,
      followUpQuestions: [...(prev.followUpQuestions || []), newQuestion],
    }));
  };

  const updateFollowUpQuestion = (questionIndex: number, updates: Partial<FollowUpQuestion>) => {
    setSettings((prev) => ({
      ...prev,
      followUpQuestions: (prev.followUpQuestions || []).map((q, i) =>
        i === questionIndex ? { ...q, ...updates } : q
      ),
    }));
  };

  const removeFollowUpQuestion = (questionIndex: number) => {
    setSettings((prev) => ({
      ...prev,
      followUpQuestions: (prev.followUpQuestions || []).filter((_, i) => i !== questionIndex),
    }));
  };

  const addOptionToQuestion = (questionIndex: number) => {
    setSettings((prev) => ({
      ...prev,
      followUpQuestions: (prev.followUpQuestions || []).map((q, i) =>
        i === questionIndex
          ? { ...q, options: [...(q.options || []), { label: "", value: "" }] }
          : q
      ),
    }));
  };

  const updateQuestionOption = (
    questionIndex: number,
    optionIndex: number,
    label: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      followUpQuestions: (prev.followUpQuestions || []).map((q, i) =>
        i === questionIndex
          ? {
              ...q,
              options: (q.options || []).map((opt, oi) =>
                oi === optionIndex ? { label, value: label } : opt
              ),
            }
          : q
      ),
    }));
  };

  const removeQuestionOption = (questionIndex: number, optionIndex: number) => {
    setSettings((prev) => ({
      ...prev,
      followUpQuestions: (prev.followUpQuestions || []).map((q, i) =>
        i === questionIndex
          ? { ...q, options: (q.options || []).filter((_, oi) => oi !== optionIndex) }
          : q
      ),
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-obsidian">Annotation Settings</h3>
        {saveStatus === "saving" && (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Loader2 className="w-3 h-3 animate-spin" />
            Saving...
          </span>
        )}
        {saveStatus === "saved" && (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <Check className="w-3 h-3" />
            Saved
          </span>
        )}
      </div>

      {/* Text Source Section */}
      <div className="border-t border-gray-100 pt-2">
        <SectionHeader
          title="Text Source"
          section="texts"
          expanded={expandedSections.texts}
          onToggle={toggleSection}
        />
        {expandedSections.texts && (
          <div className="space-y-4 mt-2">
            {/* Text Source Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-obsidian-muted mb-1">
                Where should texts come from?
              </label>

              {/* Database Source Option */}
              <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="textSource"
                  value="database"
                  checked={settings.textSource === "database"}
                  onChange={() => updateSetting("textSource", "database")}
                  className="mt-0.5 w-4 h-4 text-chili-coral border-gray-300 focus:ring-chili-coral"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-chili-coral" />
                    <span className="text-sm font-medium text-obsidian">Database Articles</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Use imported articles with quota-based assignment per participant
                  </p>
                </div>
              </label>

              {/* Manual Source Option */}
              <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="textSource"
                  value="manual"
                  checked={settings.textSource === "manual"}
                  onChange={() => updateSetting("textSource", "manual")}
                  className="mt-0.5 w-4 h-4 text-chili-coral border-gray-300 focus:ring-chili-coral"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-chili-coral" />
                    <span className="text-sm font-medium text-obsidian">Manual Entry</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter texts directly here (all participants see the same texts)
                  </p>
                </div>
              </label>
            </div>

            {/* Database Source Info */}
            {settings.textSource === "database" && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-800">
                  {articleCount > 0 ? (
                    <>
                      <p className="font-medium">{articleCount} articles loaded</p>
                      <p className="mt-1">
                        Each participant will receive {articlesPerSession} articles based on quota settings.
                        Go to Form Settings → Article Import to manage articles.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium">No articles loaded yet</p>
                      <p className="mt-1">
                        Go to Form Settings → Article Import to upload a CSV with articles.
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Practice Texts Section (only for database source) */}
            {settings.textSource === "database" && (
              <div className="border-t border-gray-100 pt-3">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="showPracticeFirst"
                    checked={settings.showPracticeFirst}
                    onChange={(e) => updateSetting("showPracticeFirst", e.target.checked)}
                    className="w-4 h-4 text-chili-coral border-gray-300 rounded focus:ring-chili-coral"
                  />
                  <label htmlFor="showPracticeFirst" className="text-sm text-obsidian">
                    Show practice texts before main task
                  </label>
                </div>

                {settings.showPracticeFirst && (
                  <div className="space-y-3 pl-6 border-l-2 border-chili-coral/20">
                    <p className="text-xs text-gray-500">
                      Practice texts help participants understand the annotation task before the real data.
                    </p>

                    {/* Practice Text List */}
                    <div className="space-y-2">
                      {(settings.practiceTexts || []).map((textItem, index) => (
                        <div key={textItem.id} className="flex items-start gap-2">
                          <span className="text-xs text-gray-400 pt-2 w-6">
                            {index + 1}.
                          </span>
                          <textarea
                            value={textItem.text}
                            onChange={(e) => updatePracticeText(index, e.target.value)}
                            placeholder="Enter practice text..."
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-chili-coral text-sm resize-none"
                            rows={2}
                          />
                          <button
                            type="button"
                            onClick={() => removePracticeText(index)}
                            className="p-1 hover:bg-gray-100 rounded text-gray-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={addPracticeText}
                      className="text-xs text-chili-coral hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add practice text
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Manual Texts Section */}
            {settings.textSource === "manual" && (
              <div className="space-y-3">
                {/* CSV Paste Area */}
                <div>
                  <label className="block text-xs font-medium text-obsidian-muted mb-1">
                    Paste CSV Data
                  </label>
                  <textarea
                    value={csvInput}
                    onChange={(e) => setCsvInput(e.target.value)}
                    placeholder="Paste CSV here (first row = headers, needs 'text' or 'tekst' column)..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-chili-coral text-sm font-mono"
                    rows={3}
                  />
                  <button
                    type="button"
                    onClick={handleCSVPaste}
                    className="mt-2 flex items-center gap-1 px-3 py-1.5 bg-chili-coral text-white text-xs rounded-lg hover:bg-chili-coral/90 transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    Import CSV
                  </button>
                </div>

                {/* Large dataset warning */}
                {settings.texts.length > MAX_TEXTS_WARNING && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800">
                      <p className="font-medium">Large dataset detected ({settings.texts.length} texts)</p>
                      <p className="mt-1">
                        For better performance, consider using Database Articles mode with the Article import feature.
                      </p>
                    </div>
                  </div>
                )}

                {/* Text List - Paginated for performance */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {settings.texts.slice(0, displayedTextsCount).map((textItem, index) => (
                    <div key={textItem.id} className="flex items-start gap-2">
                      <span className="text-xs text-gray-400 pt-2 w-6">
                        {index + 1}.
                      </span>
                      <textarea
                        value={textItem.text}
                        onChange={(e) => updateText(index, e.target.value)}
                        placeholder="Enter text passage..."
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-chili-coral text-sm resize-none"
                        rows={2}
                      />
                      <button
                        type="button"
                        onClick={() => removeText(index)}
                        className="p-1 hover:bg-gray-100 rounded text-gray-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Load More button for paginated texts */}
                {settings.texts.length > displayedTextsCount && (
                  <button
                    type="button"
                    onClick={() => setDisplayedTextsCount((prev) => prev + MAX_DISPLAYED_TEXTS)}
                    className="w-full py-2 text-xs text-chili-coral hover:bg-chili-coral/5 rounded-lg border border-dashed border-chili-coral/30 transition-colors"
                  >
                    Show more texts ({displayedTextsCount} of {settings.texts.length} shown)
                  </button>
                )}

                <button
                  type="button"
                  onClick={addText}
                  className="text-xs text-chili-coral hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add text manually
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selection Mode Section */}
      <div className="border-t border-gray-100 pt-2">
        <SectionHeader
          title="Selection Mode"
          section="selection"
          expanded={expandedSections.selection}
          onToggle={toggleSection}
        />
        {expandedSections.selection && (
          <div className="space-y-3 mt-2">
            <div>
              <label className="block text-xs font-medium text-obsidian-muted mb-1">
                Selection Type
              </label>
              <select
                value={settings.selectionMode}
                onChange={(e) =>
                  updateSetting("selectionMode", e.target.value as SelectionMode)
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-chili-coral text-sm"
              >
                <option value="sentence">Sentence Selection</option>
                <option value="word">Word Selection</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {settings.selectionMode === "sentence"
                  ? "Users can click to select entire sentences"
                  : "Users can click to select individual words"}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-obsidian-muted mb-1">
                Highlight Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.highlightColor}
                  onChange={(e) => updateSetting("highlightColor", e.target.value)}
                  className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
                />
                <Input
                  value={settings.highlightColor}
                  onChange={(e) => updateSetting("highlightColor", e.target.value)}
                  placeholder="#fef08a"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-obsidian-muted mb-1">
                Instruction Text
              </label>
              <Input
                value={settings.instructionText}
                onChange={(e) => updateSetting("instructionText", e.target.value)}
                placeholder="Selecteer een passage in de tekst hieronder"
              />
            </div>
          </div>
        )}
      </div>

      {/* Follow-up Questions Section */}
      <div className="border-t border-gray-100 pt-2">
        <SectionHeader
          title={`Follow-up Questions (${(settings.followUpQuestions || []).length})`}
          section="followup"
          expanded={expandedSections.followup}
          onToggle={toggleSection}
        />
        {expandedSections.followup && (
          <div className="space-y-4 mt-2">
            <p className="text-xs text-gray-500">
              Questions shown after text selection. Add multiple questions of different types.
            </p>

            {/* Question List */}
            {(settings.followUpQuestions || []).map((question, qIndex) => (
              <div
                key={question.id}
                className="p-3 border border-gray-200 rounded-lg space-y-3 bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-obsidian-muted">
                    Question {qIndex + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFollowUpQuestion(qIndex)}
                    className="p-1 hover:bg-gray-200 rounded text-gray-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Question Type */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-obsidian-muted mb-1">
                      Type
                    </label>
                    <select
                      value={question.type}
                      onChange={(e) =>
                        updateFollowUpQuestion(qIndex, {
                          type: e.target.value as FollowUpType,
                        })
                      }
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-chili-coral text-sm"
                    >
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="open_text">Open Text</option>
                      <option value="rating_scale">Rating Scale (1-5)</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm text-obsidian">
                      <input
                        type="checkbox"
                        checked={question.isRequired}
                        onChange={(e) =>
                          updateFollowUpQuestion(qIndex, {
                            isRequired: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-chili-coral border-gray-300 rounded focus:ring-chili-coral"
                      />
                      Required
                    </label>
                  </div>
                </div>

                {/* Question Text */}
                <div>
                  <label className="block text-xs font-medium text-obsidian-muted mb-1">
                    Question
                  </label>
                  <Input
                    value={question.question}
                    onChange={(e) =>
                      updateFollowUpQuestion(qIndex, { question: e.target.value })
                    }
                    placeholder="Enter your question..."
                  />
                </div>

                {/* Multiple Choice Options */}
                {question.type === "multiple_choice" && (
                  <div>
                    <label className="block text-xs font-medium text-obsidian-muted mb-1">
                      Options
                    </label>
                    <div className="space-y-2">
                      {(question.options || []).map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <Input
                            value={option.label}
                            onChange={(e) =>
                              updateQuestionOption(qIndex, oIndex, e.target.value)
                            }
                            placeholder={`Option ${oIndex + 1}`}
                            className="flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => removeQuestionOption(qIndex, oIndex)}
                            className="p-1 hover:bg-gray-200 rounded text-gray-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addOptionToQuestion(qIndex)}
                        className="text-xs text-chili-coral hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add option
                      </button>
                    </div>
                  </div>
                )}

                {/* Open Text Placeholder */}
                {question.type === "open_text" && (
                  <div>
                    <label className="block text-xs font-medium text-obsidian-muted mb-1">
                      Placeholder
                    </label>
                    <Input
                      value={question.placeholder || ""}
                      onChange={(e) =>
                        updateFollowUpQuestion(qIndex, {
                          placeholder: e.target.value,
                        })
                      }
                      placeholder="Type your answer here..."
                    />
                  </div>
                )}

                {/* Rating Scale Labels */}
                {question.type === "rating_scale" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-obsidian-muted mb-1">
                        Min Label (1)
                      </label>
                      <Input
                        value={question.minLabel || ""}
                        onChange={(e) =>
                          updateFollowUpQuestion(qIndex, {
                            minLabel: e.target.value,
                          })
                        }
                        placeholder="e.g., Not at all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-obsidian-muted mb-1">
                        Max Label (5)
                      </label>
                      <Input
                        value={question.maxLabel || ""}
                        onChange={(e) =>
                          updateFollowUpQuestion(qIndex, {
                            maxLabel: e.target.value,
                          })
                        }
                        placeholder="e.g., Very much"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add Question Button */}
            <button
              type="button"
              onClick={addFollowUpQuestion}
              className="w-full py-2 text-xs text-chili-coral hover:bg-chili-coral/5 rounded-lg border border-dashed border-chili-coral/30 transition-colors flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add follow-up question
            </button>
          </div>
        )}
      </div>

      {/* Display Options Section */}
      <div className="border-t border-gray-100 pt-2">
        <SectionHeader
          title="Display Options"
          section="display"
          expanded={expandedSections.display}
          onToggle={toggleSection}
        />
        {expandedSections.display && (
          <div className="space-y-3 mt-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allowSkip"
                checked={settings.allowSkip}
                onChange={(e) => updateSetting("allowSkip", e.target.checked)}
                className="w-4 h-4 text-chili-coral border-gray-300 rounded focus:ring-chili-coral"
              />
              <label
                htmlFor="allowSkip"
                className="text-sm text-obsidian"
              >
                Allow users to skip texts
              </label>
            </div>

            {settings.allowSkip && (
              <div>
                <label className="block text-xs font-medium text-obsidian-muted mb-1">
                  Skip Button Text
                </label>
                <Input
                  value={settings.skipButtonText}
                  onChange={(e) => updateSetting("skipButtonText", e.target.value)}
                  placeholder="Overslaan"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
