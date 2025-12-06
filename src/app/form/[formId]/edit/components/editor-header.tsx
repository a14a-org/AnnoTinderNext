"use client";

import type { Form } from "../types";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  Check,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  Menu,
  Play,
  Settings,
  Users,
  X,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close menu when clicking outside or pressing escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };

    if (isMobileMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
      // Prevent scrolling when menu is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-40 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Link
            href="/"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 bg-chili-coral rounded-lg flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="text-lg font-display font-bold text-obsidian bg-transparent border-none focus:outline-none focus:ring-0 w-full truncate"
              placeholder="Form title"
            />
          </div>
          {saveStatus === "saving" && (
            <span className="hidden md:flex items-center gap-1 text-sm text-gray-500 shrink-0">
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="hidden md:flex items-center gap-1 text-sm text-green-600 shrink-0">
              <Check className="w-3 h-3" />
              Saved
            </span>
          )}
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
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
          <Button
            variant="ghost"
            onClick={() => window.open(`/f/${form.slug}?preview=true`, "_blank")}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Preview
          </Button>
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

        {/* Mobile Menu Button */}
        <div className="flex lg:hidden ml-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden absolute top-16 left-0 w-full bg-white border-b border-gray-200 shadow-lg overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              <div className="flex items-center justify-between text-sm text-obsidian-muted border-b border-gray-100 pb-4">
                <span>{form._count.submissions} responses</span>
                {saveStatus === "saving" && (
                  <span className="flex items-center gap-1 text-gray-500">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Saving...
                  </span>
                )}
                {saveStatus === "saved" && (
                  <span className="flex items-center gap-1 text-green-600">
                    <Check className="w-3 h-3" />
                    Saved
                  </span>
                )}
              </div>
              
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => {
                    onTogglePublish();
                    setIsMobileMenuOpen(false);
                  }}
                  className="justify-start w-full"
                >
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

                <Button
                  variant="secondary"
                  onClick={() => window.open(`/f/${form.slug}?preview=true`, "_blank")}
                  className="justify-start w-full"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Preview
                </Button>

                <div className="h-px bg-gray-100 my-1" />

                <Button
                  variant="ghost"
                  onClick={() => router.push(`/form/${form.id}/responses`)}
                  className="justify-start w-full"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Results
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => router.push(`/form/${form.id}/sessions`)}
                  className="justify-start w-full"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Sessions
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    onToggleSettings();
                    setIsMobileMenuOpen(false);
                  }}
                  className="justify-start w-full"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </header>
    </>
  );
};
