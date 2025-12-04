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
  onDescriptionChange: (value: string) => void;
  onBrandColorChange: (value: string) => void;
  onArticlesPerSessionChange: (value: number) => void;
  onSessionTimeoutChange: (value: number) => void;
  onQuotaSettingsChange: (settings: QuotaSettings) => void;
  onDynataEnabledChange: (enabled: boolean) => void;
  onDynataReturnUrlChange: (url: string) => void;
  onDynataBasicCodeChange: (code: string) => void;
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
  onDescriptionChange,
  onBrandColorChange,
  onArticlesPerSessionChange,
  onSessionTimeoutChange,
  onQuotaSettingsChange,
  onDynataEnabledChange,
  onDynataReturnUrlChange,
  onDynataBasicCodeChange,
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-obsidian mb-1">
            Articles per Session
          </label>
          <Input
            type="number"
            value={articlesPerSession}
            onChange={(e) => onArticlesPerSessionChange(parseInt(e.target.value) || 20)}
            min={1}
          />
          <p className="text-xs text-gray-500 mt-1">How many articles each participant annotates</p>
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
            Dutch Quota per Article
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
            Minority Quota per Article
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

    {/* Article Import Section */}
    <ArticleImportSection formId={formId} onImport={onImport} articleCount={form._count?.articles || 0} />
  </div>
);
