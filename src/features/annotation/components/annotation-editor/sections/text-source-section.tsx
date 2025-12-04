"use client";

import type { TextAnnotationSettings, TextItem } from "@/features/annotation";
import type { SectionProps } from "../types";

import { useState } from "react";
import { AlertTriangle, Database, FileText, Info, Plus, Trash2, Upload } from "lucide-react";

import { SectionHeader } from "@/components/ui";
import { parseCSVToTexts } from "@/features/annotation";

const MAX_DISPLAYED_TEXTS = 100;
const MAX_TEXTS_WARNING = 50;

interface TextSourceSectionProps extends SectionProps {
  articleCount: number;
  articlesPerSession: number;
  expanded: boolean;
  onToggle: () => void;
  setSettings: React.Dispatch<React.SetStateAction<TextAnnotationSettings>>;
}

export const TextSourceSection = ({
  settings,
  updateSetting,
  articleCount,
  articlesPerSession,
  expanded,
  onToggle,
  setSettings,
}: TextSourceSectionProps) => {
  const [csvInput, setCsvInput] = useState("");
  const [displayedTextsCount, setDisplayedTextsCount] = useState(MAX_DISPLAYED_TEXTS);

  const handleCSVPaste = () => {
    if (!csvInput.trim()) return;
    const parsed = parseCSVToTexts(csvInput);
    if (parsed.length > 0) {
      setSettings((prev) => ({ ...prev, texts: [...prev.texts, ...parsed] }));
      setCsvInput("");
    }
  };

  const addText = () => {
    const newText: TextItem = { id: `text-${Date.now()}`, text: "", metadata: undefined };
    setSettings((prev) => ({ ...prev, texts: [...prev.texts, newText] }));
  };

  const updateText = (index: number, text: string) => {
    setSettings((prev) => ({
      ...prev,
      texts: prev.texts.map((t, i) => (i === index ? { ...t, text } : t)),
    }));
  };

  const removeText = (index: number) => {
    setSettings((prev) => ({ ...prev, texts: prev.texts.filter((_, i) => i !== index) }));
  };

  const addPracticeText = () => {
    const newText: TextItem = { id: `practice-${Date.now()}`, text: "", metadata: undefined };
    setSettings((prev) => ({ ...prev, practiceTexts: [...prev.practiceTexts, newText] }));
  };

  const updatePracticeText = (index: number, text: string) => {
    setSettings((prev) => ({
      ...prev,
      practiceTexts: prev.practiceTexts.map((t, i) => (i === index ? { ...t, text } : t)),
    }));
  };

  const removePracticeText = (index: number) => {
    setSettings((prev) => ({ ...prev, practiceTexts: prev.practiceTexts.filter((_, i) => i !== index) }));
  };

  return (
    <div className="border-t border-gray-100 pt-2">
      <SectionHeader title="Text Source" section="texts" expanded={expanded} onToggle={onToggle} />
      {expanded && (
        <div className="space-y-4 mt-2">
          {/* Text Source Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-obsidian-muted mb-1">
              Where should texts come from?
            </label>

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
                <p className="text-xs text-gray-500 mt-1">Use imported articles with quota-based assignment per participant</p>
              </div>
            </label>

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
                <p className="text-xs text-gray-500 mt-1">Enter texts directly here (all participants see the same texts)</p>
              </div>
            </label>
          </div>

          {/* Database Source Info */}
          {settings.textSource === "database" && (
            <>
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-800">
                  {articleCount > 0 ? (
                    <>
                      <p className="font-medium">{articleCount} articles loaded</p>
                      <p className="mt-1">Each participant will receive {articlesPerSession} articles based on quota settings.</p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium">No articles loaded yet</p>
                      <p className="mt-1">Go to Form Settings → Article Import to upload a CSV with articles.</p>
                    </>
                  )}
                </div>
              </div>

              {/* Practice Texts */}
              <div className="border-t border-gray-100 pt-3">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="showPracticeFirst"
                    checked={settings.showPracticeFirst}
                    onChange={(e) => updateSetting("showPracticeFirst", e.target.checked)}
                    className="w-4 h-4 text-chili-coral border-gray-300 rounded focus:ring-chili-coral"
                  />
                  <label htmlFor="showPracticeFirst" className="text-sm text-obsidian">Show practice texts before main task</label>
                </div>

                {settings.showPracticeFirst && (
                  <div className="space-y-3 pl-6 border-l-2 border-chili-coral/20">
                    <p className="text-xs text-gray-500">Practice texts help participants understand the annotation task before the real data.</p>
                    <div className="space-y-2">
                      {(settings.practiceTexts || []).map((textItem, index) => (
                        <div key={textItem.id} className="flex items-start gap-2">
                          <span className="text-xs text-gray-400 pt-2 w-6">{index + 1}.</span>
                          <textarea
                            value={textItem.text}
                            onChange={(e) => updatePracticeText(index, e.target.value)}
                            placeholder="Enter practice text..."
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-chili-coral text-sm resize-none"
                            rows={2}
                          />
                          <button type="button" onClick={() => removePracticeText(index)} className="p-1 hover:bg-gray-100 rounded text-gray-400">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={addPracticeText} className="text-xs text-chili-coral hover:underline flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add practice text
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Manual Texts Section */}
          {settings.textSource === "manual" && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-obsidian-muted mb-1">Paste CSV Data</label>
                <textarea
                  value={csvInput}
                  onChange={(e) => setCsvInput(e.target.value)}
                  placeholder="Paste CSV here (first row = headers, needs 'text' or 'tekst' column)..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-chili-coral text-sm font-mono"
                  rows={3}
                />
                <button type="button" onClick={handleCSVPaste} className="mt-2 flex items-center gap-1 px-3 py-1.5 bg-chili-coral text-white text-xs rounded-lg hover:bg-chili-coral/90 transition-colors">
                  <Upload className="w-3 h-3" /> Import CSV
                </button>
              </div>

              {settings.texts.length > MAX_TEXTS_WARNING && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800">
                    <p className="font-medium">Large dataset detected ({settings.texts.length} texts)</p>
                    <p className="mt-1">For better performance, consider using Database Articles mode.</p>
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {settings.texts.slice(0, displayedTextsCount).map((textItem, index) => (
                  <div key={textItem.id} className="flex items-start gap-2">
                    <span className="text-xs text-gray-400 pt-2 w-6">{index + 1}.</span>
                    <textarea
                      value={textItem.text}
                      onChange={(e) => updateText(index, e.target.value)}
                      placeholder="Enter text passage..."
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-chili-coral text-sm resize-none"
                      rows={2}
                    />
                    <button type="button" onClick={() => removeText(index)} className="p-1 hover:bg-gray-100 rounded text-gray-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {settings.texts.length > displayedTextsCount && (
                <button
                  type="button"
                  onClick={() => setDisplayedTextsCount((prev) => prev + MAX_DISPLAYED_TEXTS)}
                  className="w-full py-2 text-xs text-chili-coral hover:bg-chili-coral/5 rounded-lg border border-dashed border-chili-coral/30 transition-colors"
                >
                  Show more texts ({displayedTextsCount} of {settings.texts.length} shown)
                </button>
              )}

              <button type="button" onClick={addText} className="text-xs text-chili-coral hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add text manually
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
