"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui";
import { apiGet } from "@/lib/api";
import {
  ArrowLeft,
  Loader2,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Users,
  Filter,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface Session {
  id: string;
  externalPid: string | null;
  status: string;
  gender: string | null;
  ethnicity: string | null;
  ageRange: string | null;
  demographicGroup: string | null;
  articlesRequired: number;
  articlesCompleted: number;
  annotationCount: number;
  startedAt: string;
  lastActiveAt: string;
  completedAt: string | null;
}

interface SessionsData {
  form: {
    id: string;
    title: string;
  };
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    screenedOut: number;
    expired: number;
  };
  sessions: Session[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filter: string;
}

const statusConfig: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  completed: { label: "Completed", color: "text-green-700", bgColor: "bg-green-100" },
  started: { label: "Started", color: "text-blue-700", bgColor: "bg-blue-100" },
  demographics: { label: "Demographics", color: "text-blue-700", bgColor: "bg-blue-100" },
  annotating: { label: "Annotating", color: "text-amber-700", bgColor: "bg-amber-100" },
  screened_out: { label: "Screened Out", color: "text-red-700", bgColor: "bg-red-100" },
  expired: { label: "Expired", color: "text-gray-700", bgColor: "bg-gray-100" },
};

export default function SessionsDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.formId as string;

  const [data, setData] = useState<SessionsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const fetchSessions = async () => {
      setIsLoading(true);
      const { data: responseData, error } = await apiGet<SessionsData>(
        `/api/forms/${formId}/sessions?status=${statusFilter}&page=${page}&limit=50`
      );
      if (cancelled) return;
      if (responseData) {
        setData(responseData);
      } else {
        console.error("Failed to fetch sessions:", error);
        router.push("/");
      }
      setIsLoading(false);
    };
    fetchSessions();
    return () => { cancelled = true; };
  }, [formId, statusFilter, page, router]);

  const refetchSessions = async () => {
    setIsLoading(true);
    const { data: responseData, error } = await apiGet<SessionsData>(
      `/api/forms/${formId}/sessions?status=${statusFilter}&page=${page}&limit=50`
    );
    if (responseData) {
      setData(responseData);
    } else {
      console.error("Failed to fetch sessions:", error);
    }
    setIsLoading(false);
  };

  const handleExport = (format: "csv" | "json", status: string) => {
    window.open(
      `/api/forms/${formId}/sessions/export?status=${status}&format=${format}`,
      "_blank"
    );
  };

  const handleFilterChange = (newFilter: string) => {
    setStatusFilter(newFilter);
    setPage(1); // Reset to first page when filter changes
  };

  if (isLoading && !data) {
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
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/form/${formId}/edit`}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-chili-coral rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-display font-bold text-obsidian">
                  Sessions
                </h1>
                <p className="text-sm text-obsidian-muted">{data.form.title}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={refetchSessions}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <div className="relative">
              <Button
                variant="ghost"
                onClick={() => handleExport("csv", "all")}
              >
                <Download className="w-4 h-4 mr-2" />
                Export All
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-600" />
              </div>
              <span className="text-sm font-medium text-obsidian-muted">Total</span>
            </div>
            <p className="text-2xl font-bold text-obsidian">{data.stats.total}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-obsidian-muted">Completed</span>
            </div>
            <p className="text-2xl font-bold text-green-700">{data.stats.completed}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm font-medium text-obsidian-muted">In Progress</span>
            </div>
            <p className="text-2xl font-bold text-amber-700">{data.stats.inProgress}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-sm font-medium text-obsidian-muted">Screened Out</span>
            </div>
            <p className="text-2xl font-bold text-red-700">{data.stats.screenedOut}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-gray-500" />
              </div>
              <span className="text-sm font-medium text-obsidian-muted">Expired</span>
            </div>
            <p className="text-2xl font-bold text-gray-700">{data.stats.expired}</p>
          </div>
        </div>

        {/* Filters and Export */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-obsidian-muted" />
            <span className="text-sm text-obsidian-muted mr-2">Filter:</span>
            {["all", "completed", "in_progress", "screened_out", "expired"].map(
              (filter) => (
                <button
                  key={filter}
                  onClick={() => handleFilterChange(filter)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === filter
                      ? "bg-chili-coral text-white"
                      : "bg-gray-100 text-obsidian-muted hover:bg-gray-200"
                  }`}
                >
                  {filter === "all"
                    ? "All"
                    : filter === "in_progress"
                    ? "In Progress"
                    : filter === "screened_out"
                    ? "Screened Out"
                    : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              )
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleExport("csv", statusFilter)}
            >
              <Download className="w-4 h-4 mr-1" />
              CSV
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleExport("json", statusFilter)}
            >
              <Download className="w-4 h-4 mr-1" />
              JSON
            </Button>
          </div>
        </div>

        {/* Sessions Table */}
        {data.sessions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-obsidian mb-2">
              No sessions found
            </h2>
            <p className="text-obsidian-muted mb-6">
              {statusFilter === "all"
                ? "Sessions will appear here once participants start the survey"
                : `No sessions with status "${statusFilter.replace("_", " ")}"`}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-obsidian-muted uppercase tracking-wide">
                        PSID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-obsidian-muted uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-obsidian-muted uppercase tracking-wide">
                        Demographics
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-obsidian-muted uppercase tracking-wide">
                        Progress
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-obsidian-muted uppercase tracking-wide">
                        Started
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-obsidian-muted uppercase tracking-wide">
                        Last Active
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.sessions.map((session) => {
                      const status = statusConfig[session.status] || {
                        label: session.status,
                        color: "text-gray-700",
                        bgColor: "bg-gray-100",
                      };
                      return (
                        <tr key={session.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className="font-mono text-sm text-obsidian">
                              {session.externalPid || "-"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}
                            >
                              {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {session.demographicGroup ? (
                              <span className="text-sm text-obsidian">
                                {session.demographicGroup}
                              </span>
                            ) : session.gender || session.ethnicity || session.ageRange ? (
                              <span className="text-sm text-obsidian-muted">
                                {[session.gender, session.ethnicity, session.ageRange]
                                  .filter(Boolean)
                                  .join(", ")}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    session.annotationCount >= session.articlesRequired
                                      ? "bg-green-500"
                                      : "bg-amber-500"
                                  }`}
                                  style={{
                                    width: `${Math.min(
                                      (session.annotationCount / session.articlesRequired) * 100,
                                      100
                                    )}%`,
                                  }}
                                />
                              </div>
                              <span className="text-sm text-obsidian-muted whitespace-nowrap">
                                {session.annotationCount}/{session.articlesRequired}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-obsidian">
                              {format(new Date(session.startedAt), "MMM d, HH:mm")}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-obsidian-muted">
                              {formatDistanceToNow(new Date(session.lastActiveAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-obsidian-muted">
                  Showing {(page - 1) * data.pagination.limit + 1} to{" "}
                  {Math.min(page * data.pagination.limit, data.pagination.total)} of{" "}
                  {data.pagination.total} sessions
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-obsidian-muted">
                    Page {page} of {data.pagination.totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                    disabled={page >= data.pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
