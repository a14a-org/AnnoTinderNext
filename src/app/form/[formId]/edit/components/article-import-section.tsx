"use client";

import { useRef, useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui";
import { apiPost, apiDelete } from "@/lib/api";

interface ArticleImportSectionProps {
  formId: string;
  onImport: () => void;
  articleCount: number;
  assignmentStrategy?: "INDIVIDUAL" | "JOB_SET";
  jobSetSize?: number;
}

export const ArticleImportSection = ({
  formId,
  onImport,
  articleCount,
  assignmentStrategy = "INDIVIDUAL",
  jobSetSize = 3,
}: ArticleImportSectionProps) => {
  const [csvData, setCsvData] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setCsvData(text);
  };

  const handleImport = async () => {
    if (!csvData.trim()) return;

    setIsImporting(true);
    setImportStatus(null);

    const { data, error } = await apiPost<{ imported: number }>(`/api/forms/${formId}/articles`, { 
      csv: csvData,
      assignmentStrategy,
      jobSetSize
    });

    if (data) {
      setImportStatus({
        type: "success",
        message: `Imported ${data.imported} articles successfully!`,
      });
      setCsvData("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onImport();
    } else {
      setImportStatus({
        type: "error",
        message: error || "Failed to import articles",
      });
    }
    setIsImporting(false);
  };

  const handleClearArticles = async () => {
    if (!confirm("Are you sure you want to delete all articles? This cannot be undone.")) {
      return;
    }

    const { ok, error } = await apiDelete(`/api/forms/${formId}/articles`);

    if (ok) {
      setImportStatus({
        type: "success",
        message: "All articles deleted successfully",
      });
      onImport();
    } else {
      setImportStatus({
        type: "error",
        message: error || "Failed to delete articles",
      });
    }
  };

  return (
    <div className="border-t border-gray-100 pt-4">
      <h4 className="font-medium text-obsidian mb-3 flex items-center gap-2">
        <Upload className="w-4 h-4" />
        Article Import
      </h4>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-obsidian mb-1">
            Upload CSV File
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-chili-coral file:text-white hover:file:bg-chili-coral/90 cursor-pointer"
          />
          <p className="text-xs text-gray-500 mt-1">
            CSV must have &quot;text&quot; (or &quot;tekst&quot;) and &quot;ARTICLE_SHORT_ID&quot; columns.
            {assignmentStrategy === "JOB_SET" && (
              <span className="block mt-1 font-medium text-blue-600">
                Job Set Mode: Articles will be automatically grouped into sets of {jobSetSize}.
              </span>
            )}
          </p>
        </div>

        {csvData && (
          <div>
            <label className="block text-sm font-medium text-obsidian mb-1">
              Preview
            </label>
            <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-x-auto max-h-32 overflow-y-auto">
              {csvData.slice(0, 500)}
              {csvData.length > 500 && "..."}
            </pre>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            onClick={handleImport}
            disabled={!csvData.trim() || isImporting}
            className="flex items-center gap-2"
          >
            {isImporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {isImporting ? "Importing..." : "Import Articles"}
          </Button>

          {articleCount > 0 && (
            <Button
              variant="ghost"
              onClick={handleClearArticles}
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear All ({articleCount})
            </Button>
          )}
        </div>

        {importStatus && (
          <div
            className={`p-3 rounded-lg text-sm ${
              importStatus.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {importStatus.message}
          </div>
        )}
      </div>
    </div>
  );
};
