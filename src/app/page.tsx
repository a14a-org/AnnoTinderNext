"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import {
  BarChart3,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui";

interface Form {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    questions: number;
    submissions: number;
  };
}

const CreateFormTrigger = ({ onTrigger, isLoading }: { onTrigger: () => void; isLoading: boolean }) => {
  const searchParams = useSearchParams();
  const createTriggered = useRef(false);

  useEffect(() => {
    if (searchParams.get("action") === "create" && !createTriggered.current && !isLoading) {
      createTriggered.current = true;
      onTrigger();
    }
  }, [searchParams, isLoading, onTrigger]);

  return null;
};

const FormsPage = () => {
  const router = useRouter();
  const [forms, setForms] = useState<Form[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const res = await fetch("/api/forms");
      if (res.ok) {
        const data = await res.json();
        setForms(data);
      }
    } catch (error) {
      console.error("Failed to fetch forms:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateForm = async () => {
    setIsCreating(true);
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled Form",
          description: "",
        }),
      });

      if (res.ok) {
        const form = await res.json();
        router.push(`/form/${form.id}/edit`);
      }
    } catch (error) {
      console.error("Failed to create form:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (!confirm("Are you sure you want to delete this form?")) return;

    try {
      const res = await fetch(`/api/forms/${formId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setForms(forms.filter((f) => f.id !== formId));
      }
    } catch (error) {
      console.error("Failed to delete form:", error);
    }
    setMenuOpen(null);
  };

  const copyFormLink = (slug: string) => {
    const url = `${window.location.origin}/f/${slug}`;
    navigator.clipboard.writeText(url);
    setMenuOpen(null);
  };

  return (
    <div className="min-h-screen bg-canvas">
      <Suspense fallback={null}>
        <CreateFormTrigger onTrigger={handleCreateForm} isLoading={isLoading} />
      </Suspense>

      {/* Header */}
      <header className="sticky top-0 z-40 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-chili-coral rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-obsidian">ChiliForm</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-obsidian">
                Forms
              </h1>
              <p className="text-obsidian-muted mt-1">
                Create beautiful forms and collect responses
              </p>
            </div>
            <Button onClick={handleCreateForm} disabled={isCreating}>
              {isCreating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              New Form
            </Button>
          </div>

          {/* Forms List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-chili-coral" />
            </div>
          ) : forms.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-lg font-semibold text-obsidian mb-2">
                No forms yet
              </h2>
              <p className="text-obsidian-muted mb-6">
                Create your first form to start collecting responses
              </p>
              <Button onClick={handleCreateForm} disabled={isCreating}>
                {isCreating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Form
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {forms.map((form) => (
                <div
                  key={form.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  {/* Card Header */}
                  <div
                    className="p-6 cursor-pointer"
                    onClick={() => router.push(`/form/${form.id}/edit`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-obsidian truncate">
                          {form.title}
                        </h3>
                        {form.description && (
                          <p className="text-sm text-obsidian-muted line-clamp-2 mt-1">
                            {form.description}
                          </p>
                        )}
                      </div>
                      <div className="relative ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(menuOpen === form.id ? null : form.id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                        {menuOpen === form.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/form/${form.id}/edit`);
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-obsidian hover:bg-gray-50"
                            >
                              <FileText className="w-4 h-4" />
                              Edit Form
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/form/${form.id}/responses`);
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-obsidian hover:bg-gray-50"
                            >
                              <BarChart3 className="w-4 h-4" />
                              View Responses
                            </button>
                            {form.isPublished && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`/f/${form.slug}`, "_blank");
                                  }}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-obsidian hover:bg-gray-50"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  Open Form
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyFormLink(form.slug);
                                  }}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-obsidian hover:bg-gray-50"
                                >
                                  <Copy className="w-4 h-4" />
                                  Copy Link
                                </button>
                              </>
                            )}
                            <hr className="my-1 border-gray-100" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteForm(form.id);
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2 mt-4">
                      {form.isPublished ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                          <Eye className="w-3 h-3" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                          Draft
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-sm text-obsidian-muted">
                    <span>{form._count.questions} questions</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/form/${form.id}/responses`);
                      }}
                      className="flex items-center gap-1.5 hover:text-chili-coral transition-colors"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>{form._count.submissions} responses</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FormsPage;
