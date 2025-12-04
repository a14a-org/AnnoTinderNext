"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui";
import { apiGet, apiDelete } from "@/lib/api";
import {
  ArrowLeft,
  Loader2,
  Trash2,
  Download,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface Question {
  id: string;
  title: string;
  type: string;
}

interface AnswerData {
  questionId: string;
  questionTitle: string;
  questionType: string;
  value: unknown;
}

interface Submission {
  id: string;
  submittedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  answers: Record<string, AnswerData>;
}

interface ResponsesData {
  form: {
    id: string;
    title: string;
    questions: Question[];
  };
  submissions: Submission[];
  total: number;
}

export default function FormResponsesPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.formId as string;

  const [data, setData] = useState<ResponsesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSubmissions, setExpandedSubmissions] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    let cancelled = false;
    const fetchResponses = async () => {
      const { data: responseData, error } = await apiGet<ResponsesData>(`/api/forms/${formId}/submissions`);
      if (cancelled) return;
      if (responseData) {
        setData(responseData);
      } else {
        console.error("Failed to fetch responses:", error);
        router.push("/");
      }
      setIsLoading(false);
    };
    fetchResponses();
    return () => { cancelled = true; };
  }, [formId, router]);

  const refetchResponses = async () => {
    const { data: responseData, error } = await apiGet<ResponsesData>(`/api/forms/${formId}/submissions`);
    if (responseData) {
      setData(responseData);
    } else {
      console.error("Failed to fetch responses:", error);
    }
  };

  const deleteSubmission = async (submissionId: string) => {
    if (!confirm("Delete this response?")) return;

    const { ok, error } = await apiDelete(`/api/forms/${formId}/submissions?submissionId=${submissionId}`);
    if (ok) {
      await refetchResponses();
    } else {
      console.error("Failed to delete submission:", error);
    }
  };

  const toggleSubmission = (id: string) => {
    setExpandedSubmissions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const exportToCSV = () => {
    if (!data) return;

    const headers = ["Submission Date", ...data.form.questions.map((q) => q.title)];
    const rows = data.submissions.map((submission) => {
      const dateCell = format(new Date(submission.submittedAt), "yyyy-MM-dd HH:mm:ss");
      const answerCells = data.form.questions.map((question) => {
        const answer = submission.answers[question.id];
        if (!answer) return "";
        if (Array.isArray(answer.value)) {
          return answer.value.join(", ");
        }
        if (typeof answer.value === "boolean") {
          return answer.value ? "Yes" : "No";
        }
        return String(answer.value || "");
      });
      return [dateCell, ...answerCells];
    });

    const csvContent = [
      headers.map((h) => `"${h}"`).join(","),
      ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${data.form.title.replace(/[^a-z0-9]/gi, "_")}_responses.csv`;
    link.click();
  };

  const formatAnswerValue = (answer: AnswerData): string => {
    if (answer.value === null || answer.value === undefined) return "-";

    if (Array.isArray(answer.value)) {
      return answer.value.join(", ");
    }

    if (typeof answer.value === "boolean") {
      return answer.value ? "Yes" : "No";
    }

    if (answer.questionType === "DATE" && answer.value) {
      return format(new Date(String(answer.value)), "MMM d, yyyy");
    }

    return String(answer.value);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-chili-coral" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <header className="sticky top-0 z-40 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/form/${formId}/edit`}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-chili-coral rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-display font-bold text-obsidian">
                  Responses
                </h1>
                <p className="text-sm text-obsidian-muted">{data.form.title}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-obsidian-muted">
              {data.total} {data.total === 1 ? "response" : "responses"}
            </span>
            {data.submissions.length > 0 && (
              <Button variant="ghost" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Responses List */}
        {data.submissions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-obsidian mb-2">
              No responses yet
            </h2>
            <p className="text-obsidian-muted mb-6">
              Responses will appear here once someone submits your form
            </p>
            <Link href={`/form/${formId}/edit`}>
              <Button variant="ghost">Back to Editor</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {data.submissions.map((submission) => {
              const isExpanded = expandedSubmissions.has(submission.id);
              const completionTime =
                submission.startedAt && submission.completedAt
                  ? Math.round(
                      (new Date(submission.completedAt).getTime() -
                        new Date(submission.startedAt).getTime()) /
                        1000
                    )
                  : null;

              return (
                <div
                  key={submission.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  {/* Submission Header */}
                  <button
                    onClick={() => toggleSubmission(submission.id)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium text-obsidian">
                          {format(
                            new Date(submission.submittedAt),
                            "MMM d, yyyy 'at' h:mm a"
                          )}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-obsidian-muted mt-1">
                          <span>
                            {formatDistanceToNow(
                              new Date(submission.submittedAt),
                              { addSuffix: true }
                            )}
                          </span>
                          {completionTime !== null && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {completionTime < 60
                                ? `${completionTime}s`
                                : `${Math.floor(completionTime / 60)}m ${completionTime % 60}s`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSubmission(submission.id);
                        }}
                        className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Submission Details */}
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-gray-100">
                      <div className="divide-y divide-gray-100">
                        {data.form.questions.map((question) => {
                          const answer = submission.answers[question.id];
                          return (
                            <div key={question.id} className="py-4">
                              <p className="text-sm font-medium text-obsidian-muted mb-1">
                                {question.title}
                              </p>
                              <p className="text-obsidian">
                                {answer ? formatAnswerValue(answer) : "-"}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
