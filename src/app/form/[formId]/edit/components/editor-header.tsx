"use client";

import type { Form } from "../types";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Check,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  Play,
  Settings,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui";

interface EditorHeaderProps {
  form: Form;
  title: string;
  saveStatus: "idle" | "saving" | "saved";
  isPublished: boolean;
  onTitleChange: (title: string) => void;
  onToggleSettings: () => void;
  onTogglePublish: () => void;
}

export const EditorHeader = ({
  form,
  title,
  saveStatus,
  isPublished,
  onTitleChange,
  onToggleSettings,
  onTogglePublish,
}: EditorHeaderProps) => {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-chili-coral rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="text-lg font-display font-bold text-obsidian bg-transparent border-none focus:outline-none focus:ring-0"
              placeholder="Form title"
            />
          </div>
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <Check className="w-3 h-3" />
              Saved
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-obsidian-muted">
            {form._count.submissions} responses
          </span>
          <Button
            variant="ghost"
            onClick={() => router.push(`/form/${form.id}/responses`)}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Results
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push(`/form/${form.id}/sessions`)}
          >
            <Users className="w-4 h-4 mr-2" />
            Sessions
          </Button>
          <Button
            variant="ghost"
            onClick={onToggleSettings}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          {form.isPublished && (
            <Button
              variant="ghost"
              onClick={() => window.open(`/f/${form.slug}`, "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Preview
            </Button>
          )}
          <Button onClick={onTogglePublish}>
            {isPublished ? (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Published
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Publish
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};
