"use client";

import { useEffect, useState, useRef, Suspense, useCallback } from "react";
import {
  BarChart3,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  LogOut,
  MoreHorizontal,
  Plus,
  Trash2,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

import { Button } from "@/components/ui";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import type { FormImportResult } from "@/features/form-export";

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
  const { data: session, status } = useSession();
  const [forms, setForms] = useState<Form[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<FormImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Redirect to sign-in if not authenticated
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    // Don't fetch forms until we know we're authenticated
    if (status !== "authenticated") {
      return;
    }

    const fetchForms = async () => {
      const { data, error } = await apiGet<Form[]>("/api/forms");
      if (data) {
        setForms(data);
      } else {
        console.error("Failed to fetch forms:", error);
      }
      setIsLoading(false);
    };
    fetchForms();
  }, [status, router]);

  const handleCreateForm = async () => {
    setIsCreating(true);
    const { data, error } = await apiPost<Form>("/api/forms", {
      title: "Untitled Form",
      description: "",
    });
    if (data) {
      router.push(`/form/${data.id}/edit`);
    } else {
      console.error("Failed to create form:", error);
    }
    setIsCreating(false);
  };

  const handleDeleteForm = async (formId: string) => {
    if (!confirm("Are you sure you want to delete this form?")) return;

    const { ok, error } = await apiDelete(`/api/forms/${formId}`);
    if (ok) {
      setForms(forms.filter((f) => f.id !== formId));
    } else {
      console.error("Failed to delete form:", error);
    }
    setMenuOpen(null);
  };

  const copyFormLink = (slug: string) => {
    const url = `${window.location.origin}/f/${slug}`;
    navigator.clipboard.writeText(url);
    setMenuOpen(null);
  };

  const handleImportClick = () => {
    setImportFile(null);
    setImportResult(null);
    setImportError(null);
    setShowImportModal(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".json")) {
        setImportError("Please select a JSON file");
        return;
      }
      setImportFile(file);
      setImportError(null);
    }
  };

  const handleImport = useCallback(async () => {
    if (!importFile) return;

    setIsImporting(true);
    setImportError(null);

    try {
      const text = await importFile.text();
      const data = JSON.parse(text);

      const { data: result, error } = await apiPost<FormImportResult>(
        "/api/forms/import",
        data
      );

      if (result) {
        setImportResult(result);
        // Refresh forms list
        const { data: updatedForms } = await apiGet<Form[]>("/api/forms");
        if (updatedForms) {
          setForms(updatedForms);
        }
      } else {
        setImportError(error || "Failed to import form");
      }
    } catch (err) {
      console.error("Import error:", err);
      setImportError(
        err instanceof SyntaxError
          ? "Invalid JSON file"
          : "Failed to import form"
      );
    } finally {
      setIsImporting(false);
    }
  }, [importFile]);

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportResult(null);
    setImportError(null);
  };

  // Show loading while checking auth status
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-chili-coral" />
      </div>
    );
  }

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
          {session?.user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-obsidian-muted">
                {session.user.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-obsidian-muted hover:text-obsidian rounded-lg hover:bg-gray-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
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
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={handleImportClick}>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button onClick={handleCreateForm} disabled={isCreating}>
                {isCreating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                New Form
              </Button>
            </div>
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

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-display font-bold text-obsidian">
                Import Form
              </h2>
              <button
                onClick={closeImportModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {importResult ? (
                // Success state
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-obsidian mb-2">
                    Import Successful
                  </h3>
                  <p className="text-obsidian-muted mb-4">
                    &ldquo;{importResult.title}&rdquo; has been imported with{" "}
                    {importResult.questionsImported} questions
                    {importResult.articlesImported > 0 &&
                      ` and ${importResult.articlesImported} articles`}
                    .
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="secondary" onClick={closeImportModal}>
                      Close
                    </Button>
                    <Button
                      onClick={() => {
                        router.push(`/form/${importResult.formId}/edit`);
                        closeImportModal();
                      }}
                    >
                      Edit Form
                    </Button>
                  </div>
                </div>
              ) : (
                // Upload state
                <>
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                      importFile
                        ? "border-chili-coral bg-red-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {importFile ? (
                      <div>
                        <FileText className="w-12 h-12 text-chili-coral mx-auto mb-3" />
                        <p className="font-medium text-obsidian">
                          {importFile.name}
                        </p>
                        <p className="text-sm text-obsidian-muted mt-1">
                          {(importFile.size / 1024).toFixed(1)} KB
                        </p>
                        <button
                          onClick={() => {
                            setImportFile(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                          className="text-sm text-chili-coral hover:underline mt-2"
                        >
                          Choose a different file
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-obsidian mb-1">
                          Drop your JSON file here, or{" "}
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-chili-coral hover:underline"
                          >
                            browse
                          </button>
                        </p>
                        <p className="text-sm text-obsidian-muted">
                          Export a form from another project to import it here
                        </p>
                      </div>
                    )}
                  </div>

                  {importError && (
                    <div className="flex items-center gap-2 mt-4 p-3 bg-red-50 text-red-700 rounded-lg">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <p className="text-sm">{importError}</p>
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="secondary"
                      onClick={closeImportModal}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleImport}
                      disabled={!importFile || isImporting}
                      className="flex-1"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Import
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormsPage;
