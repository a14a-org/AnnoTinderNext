"use client";

import type { Form, QuotaSettings } from "../types";

import { ExternalLink, FileSpreadsheet } from "lucide-react";

import { Input } from "@/components/ui";
import { ArticleImportSection } from "./article-import-section";

interface SettingsPanelProps {
  form: Form;
  formId: string;
  description: string;
  brandColor: string;
  articlesPerSession: number;
  sessionTimeoutMins: number;
  quotaSettings: QuotaSettings;
  dynataEnabled: boolean;
  dynataReturnUrl: string;
  dynataBasicCode: string;
  motivactionEnabled: boolean;
  motivactionReturnUrl: string;
  assignmentStrategy: "INDIVIDUAL" | "JOB_SET";
  onDescriptionChange: (value: string) => void;
  onBrandColorChange: (value: string) => void;
  onArticlesPerSessionChange: (value: number) => void;
  onSessionTimeoutChange: (value: number) => void;
  onQuotaSettingsChange: (settings: QuotaSettings) => void;
  onDynataEnabledChange: (enabled: boolean) => void;
  onDynataReturnUrlChange: (url: string) => void;
  onDynataBasicCodeChange: (code: string) => void;
  onMotivactionEnabledChange: (enabled: boolean) => void;
  onMotivactionReturnUrlChange: (url: string) => void;
  onAssignmentStrategyChange: (strategy: "INDIVIDUAL" | "JOB_SET") => void;
  onImport: () => void;
}

export const SettingsPanel = ({
  form,
  formId,
  description,
  brandColor,
  articlesPerSession,
  sessionTimeoutMins,
  quotaSettings,
  dynataEnabled,
  dynataReturnUrl,
  dynataBasicCode,
  motivactionEnabled,
  motivactionReturnUrl,
  assignmentStrategy,
  onDescriptionChange,
  onBrandColorChange,
  onArticlesPerSessionChange,
  onSessionTimeoutChange,
  onQuotaSettingsChange,
  onDynataEnabledChange,
  onDynataReturnUrlChange,
  onDynataBasicCodeChange,
  onMotivactionEnabledChange,
  onMotivactionReturnUrlChange,
  onAssignmentStrategyChange,
  onImport,
}: SettingsPanelProps) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-6">
    <h3 className="font-semibold text-obsidian">Form Settings</h3>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-obsidian mb-1">
          Description
        </label>
        <Input
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Form description"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-obsidian mb-1">
          Brand Color
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={brandColor}
            onChange={(e) => onBrandColorChange(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer"
          />
          <Input
            value={brandColor}
            onChange={(e) => onBrandColorChange(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>
    </div>
    <div className="pt-2">
      <p className="text-sm text-obsidian-muted">
        Public URL:{" "}
        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
          {typeof window !== "undefined" ? window.location.origin : ""}/f/{form.slug}
        </code>
      </p>
    </div>

    {/* Quota Settings Section */}
    <div className="border-t border-gray-100 pt-4">
      <h4 className="font-medium text-obsidian mb-3 flex items-center gap-2">
        <FileSpreadsheet className="w-4 h-4" />
        Annotation Quota Settings
      </h4>
      
      {/* Assignment Strategy Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-obsidian mb-2">
          Assignment Strategy
        </label>
        {(form._count?.articles ?? 0) > 0 && (
          <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Strategy locked:</strong> Clear all articles before changing the assignment strategy.
            </p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onAssignmentStrategyChange("INDIVIDUAL")}
            disabled={(form._count?.articles ?? 0) > 0}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              assignmentStrategy === "INDIVIDUAL"
                ? "border-chili-coral bg-chili-coral/5 ring-1 ring-chili-coral"
                : "border-gray-200 hover:border-gray-300"
            } ${(form._count?.articles ?? 0) > 0 ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="font-medium text-obsidian mb-1">Individual Mode</div>
            <p className="text-xs text-obsidian-muted">
              Assigns random articles one by one. Best for simple annotation tasks.
            </p>
          </button>
          <button
            onClick={() => onAssignmentStrategyChange("JOB_SET")}
            disabled={(form._count?.articles ?? 0) > 0}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              assignmentStrategy === "JOB_SET"
                ? "border-chili-coral bg-chili-coral/5 ring-1 ring-chili-coral"
                : "border-gray-200 hover:border-gray-300"
            } ${(form._count?.articles ?? 0) > 0 ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="font-medium text-obsidian mb-1">Job Set Mode</div>
            <p className="text-xs text-obsidian-muted">
              Assigns pre-grouped sets of articles (e.g. 3). Guarantees consistent grouping.
            </p>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-obsidian mb-1">
            {assignmentStrategy === "JOB_SET" ? "Job Set Size" : "Articles per Session"}
          </label>
          <Input
            type="number"
            value={articlesPerSession}
            onChange={(e) => onArticlesPerSessionChange(parseInt(e.target.value) || (assignmentStrategy === "JOB_SET" ? 3 : 20))}
            min={1}
            // Removed disabled prop to allow configuration
          />
          <p className="text-xs text-gray-500 mt-1">
            {assignmentStrategy === "JOB_SET" 
              ? "How many articles are grouped into one set (usually 3)" 
              : "How many articles each participant annotates"}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-obsidian mb-1">
            Session Timeout (minutes)
          </label>
          <Input
            type="number"
            value={sessionTimeoutMins}
            onChange={(e) => onSessionTimeoutChange(parseInt(e.target.value) || 10)}
            min={1}
          />
          <p className="text-xs text-gray-500 mt-1">Session expires after this inactivity</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-obsidian mb-1">
            Dutch Quota per {assignmentStrategy === "JOB_SET" ? "Set" : "Article"}
          </label>
          <Input
            type="number"
            value={quotaSettings.groups.dutch?.target || 1}
            onChange={(e) => onQuotaSettingsChange({
              ...quotaSettings,
              groups: {
                ...quotaSettings.groups,
                dutch: { ...quotaSettings.groups.dutch, target: parseInt(e.target.value) || 1 }
              }
            })}
            min={0}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-obsidian mb-1">
            Minority Quota per {assignmentStrategy === "JOB_SET" ? "Set" : "Article"}
          </label>
          <Input
            type="number"
            value={quotaSettings.groups.minority?.target || 2}
            onChange={(e) => onQuotaSettingsChange({
              ...quotaSettings,
              groups: {
                ...quotaSettings.groups,
                minority: { ...quotaSettings.groups.minority, target: parseInt(e.target.value) || 2 }
              }
            })}
            min={0}
          />
        </div>
      </div>
      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-obsidian-muted">
          <strong>Articles loaded:</strong> {form._count?.articles || 0}
          {form._count?.articles > 0 && (
            <span className="ml-2">
              (Total participants needed: {(form._count?.articles || 0) * ((quotaSettings.groups.dutch?.target || 0) + (quotaSettings.groups.minority?.target || 0))})
            </span>
          )}
        </p>
      </div>
    </div>

    {/* Dynata Panel Integration Section */}
    <div className="border-t border-gray-100 pt-4">
      <h4 className="font-medium text-obsidian mb-3 flex items-center gap-2">
        <ExternalLink className="w-4 h-4" />
        Panel Integration (Dynata)
      </h4>

      <div className="flex items-center gap-3 mb-4">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={dynataEnabled}
            onChange={(e) => onDynataEnabledChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-chili-coral/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-chili-coral"></div>
        </label>
        <span className="text-sm font-medium text-obsidian">Enable Dynata Integration</span>
      </div>

      {dynataEnabled && (
        <div className="space-y-4 pl-4 border-l-2 border-chili-coral/20">
          <div className="p-3 bg-blue-50 rounded-lg mb-4">
            <p className="text-sm text-blue-800">
              <strong>Entry URL for Dynata:</strong>
            </p>
            <code className="text-xs bg-blue-100 px-2 py-1 rounded mt-1 block break-all">
              {typeof window !== 'undefined' ? window.location.origin : ''}/f/{form?.slug}?psid={"{{psid}}"}
            </code>
          </div>

          <div>
            <label className="block text-sm font-medium text-obsidian mb-1">
              Return URL Base
            </label>
            <Input
              type="url"
              value={dynataReturnUrl}
              onChange={(e) => onDynataReturnUrlChange(e.target.value)}
              placeholder="https://api.dynata.com/respondent/exit"
            />
            <p className="text-xs text-gray-500 mt-1">
              Base URL for redirecting participants back to Dynata
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-obsidian mb-1">
              Basic Code
            </label>
            <Input
              type="text"
              value={dynataBasicCode}
              onChange={(e) => onDynataBasicCodeChange(e.target.value)}
              placeholder="Your project-specific basic code"
            />
            <p className="text-xs text-gray-500 mt-1">
              Project-specific code provided by Dynata (appended as &basic=xxx)
            </p>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg text-sm text-obsidian-muted">
            <p className="font-medium mb-2">Redirect URLs (auto-generated):</p>
            <ul className="space-y-1 text-xs">
              <li><span className="text-green-600">Complete:</span> ?rst=1&psid=xxx&basic=xxx</li>
              <li><span className="text-yellow-600">Screenout:</span> ?rst=2&psid=xxx&basic=xxx</li>
              <li><span className="text-red-600">Over Quota:</span> ?rst=3&psid=xxx&basic=xxx</li>
            </ul>
          </div>
        </div>
      )}
    </div>

    {/* Motivaction (StemPunt) Panel Integration Section */}
    <div className="border-t border-gray-100 pt-4">
      <h4 className="font-medium text-obsidian mb-3 flex items-center gap-2">
        <ExternalLink className="w-4 h-4" />
        Panel Integration (Motivaction / StemPunt)
      </h4>

      <div className="flex items-center gap-3 mb-4">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={motivactionEnabled}
            onChange={(e) => onMotivactionEnabledChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-chili-coral/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-chili-coral"></div>
        </label>
        <span className="text-sm font-medium text-obsidian">Enable Motivaction Integration</span>
      </div>

      {motivactionEnabled && (
        <div className="space-y-4 pl-4 border-l-2 border-chili-coral/20">
          <div className="p-3 bg-blue-50 rounded-lg mb-4">
            <p className="text-sm text-blue-800">
              <strong>Entry URL for Motivaction:</strong>
            </p>
            <code className="text-xs bg-blue-100 px-2 py-1 rounded mt-1 block break-all">
              {typeof window !== 'undefined' ? window.location.origin : ''}/f/{form?.slug}?d={"{{d}}"}&k={"{{k}}"}
            </code>
          </div>

          <div>
            <label className="block text-sm font-medium text-obsidian mb-1">
              Return URL Base
            </label>
            <Input
              type="url"
              value={motivactionReturnUrl}
              onChange={(e) => onMotivactionReturnUrlChange(e.target.value)}
              placeholder="https://www.stempunt.nu/s.asp"
            />
            <p className="text-xs text-gray-500 mt-1">
              Base URL for redirecting participants back to StemPunt
            </p>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg text-sm text-obsidian-muted">
            <p className="font-medium mb-2">Redirect URLs (auto-generated):</p>
            <ul className="space-y-1 text-xs">
              <li><span className="text-green-600">Complete:</span> ?d=xx&k=yy&extid=01&q=return</li>
              <li><span className="text-yellow-600">Screenout:</span> ?d=xx&k=yy&extid=02&q=return</li>
              <li><span className="text-red-600">Over Quota:</span> ?d=xx&k=yy&extid=03&q=return</li>
            </ul>
          </div>
        </div>
      )}
    </div>

    {/* Article Import Section */}
    <ArticleImportSection 
      formId={formId} 
      onImport={onImport} 
      articleCount={form._count?.articles || 0} 
      assignmentStrategy={assignmentStrategy}
      jobSetSize={articlesPerSession}
    />
  </div>
);
