"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Reorder } from "framer-motion";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import {
  ArrowLeft,
  Plus,
  Loader2,
  Eye,
  Settings,
  Trash2,
  GripVertical,
  Type,
  AlignLeft,
  Mail,
  Hash,
  ListChecks,
  CheckSquare,
  ChevronDown,
  Star,
  ToggleLeft,
  Calendar,
  Play,
  Heart,
  ExternalLink,
  BarChart3,
  Check,
  FileText,
  ShieldCheck,
  Highlighter,
  Users,
  Upload,
  FileSpreadsheet,
} from "lucide-react";
import { InformedConsentEditor } from "@/components/molecules/InformedConsentEditor";
import { InformedConsentSettings, DEFAULT_CONSENT_SETTINGS } from "@/lib/informed-consent";
import { AnnotationEditor } from "@/components/molecules/AnnotationEditor";
import { TextAnnotationSettings, DEFAULT_ANNOTATION_SETTINGS } from "@/lib/text-annotation";
import { DemographicsEditor } from "@/components/molecules/DemographicsEditor";
import { DemographicsSettings, DEFAULT_DEMOGRAPHICS_SETTINGS } from "@/lib/demographics";

interface QuestionOption {
  id: string;
  label: string;
  value: string;
  displayOrder: number;
}

interface Question {
  id: string;
  type: string;
  title: string;
  description: string | null;
  placeholder: string | null;
  isRequired: boolean;
  displayOrder: number;
  settings: Record<string, unknown> | null;
  options: QuestionOption[];
}

interface QuestionUpdatePayload {
  type?: string;
  title?: string;
  description?: string | null;
  placeholder?: string | null;
  isRequired?: boolean;
  settings?: Record<string, unknown> | null;
  options?: Array<{ label: string; value: string }>;
}

interface Form {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  brandColor: string | null;
  buttonText: string | null;
  submitText: string | null;
  isPublished: boolean;
  allowMultiple: boolean;
  showProgressBar: boolean;
  // Quota settings
  articlesPerSession: number;
  quotaSettings: string | null;
  sessionTimeoutMins: number;
  questions: Question[];
  _count: {
    submissions: number;
    articles: number;
  };
}

const questionTypes = [
  { type: "SHORT_TEXT", label: "Short Text", icon: Type },
  { type: "LONG_TEXT", label: "Long Text", icon: AlignLeft },
  { type: "EMAIL", label: "Email", icon: Mail },
  { type: "NUMBER", label: "Number", icon: Hash },
  { type: "MULTIPLE_CHOICE", label: "Multiple Choice", icon: ListChecks },
  { type: "CHECKBOXES", label: "Checkboxes", icon: CheckSquare },
  { type: "DROPDOWN", label: "Dropdown", icon: ChevronDown },
  { type: "RATING", label: "Rating", icon: Star },
  { type: "YES_NO", label: "Yes / No", icon: ToggleLeft },
  { type: "DATE", label: "Date", icon: Calendar },
  { type: "INFORMED_CONSENT", label: "Informed Consent", icon: ShieldCheck },
  { type: "TEXT_ANNOTATION", label: "Text Annotation", icon: Highlighter },
  { type: "DEMOGRAPHICS", label: "Demographics", icon: Users },
];

const isChoiceType = (type: string) =>
  ["MULTIPLE_CHOICE", "CHECKBOXES", "DROPDOWN"].includes(type);

export default function FormEditorPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.formId as string;

  const [form, setForm] = useState<Form | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [brandColor, setBrandColor] = useState("#FF5A5F");
  const [isPublished, setIsPublished] = useState(false);

  // Quota settings state
  const [articlesPerSession, setArticlesPerSession] = useState(20);
  const [sessionTimeoutMins, setSessionTimeoutMins] = useState(10);
  const [quotaSettings, setQuotaSettings] = useState({
    groupByField: "ethnicity",
    groups: {
      dutch: { values: ["Nederlands", "Duits", "Polls"], target: 1 },
      minority: { values: ["Surinaams", "Turks", "Marokkaans", "Antilliaans/Arubaans", "Indonesisch", "Anders"], target: 2 },
    },
  });

  // Dynata panel integration settings
  const [dynataEnabled, setDynataEnabled] = useState(false);
  const [dynataReturnUrl, setDynataReturnUrl] = useState("");
  const [dynataBasicCode, setDynataBasicCode] = useState("");

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);

  const fetchForm = useCallback(async () => {
    try {
      const res = await fetch(`/api/forms/${formId}`);
      if (res.ok) {
        const data = await res.json();
        setForm(data);
        setTitle(data.title);
        setDescription(data.description || "");
        setBrandColor(data.brandColor || "#FF5A5F");
        setIsPublished(data.isPublished);
        // Load quota settings
        setArticlesPerSession(data.articlesPerSession ?? 20);
        setSessionTimeoutMins(data.sessionTimeoutMins ?? 10);
        if (data.quotaSettings) {
          const parsed = typeof data.quotaSettings === 'string'
            ? JSON.parse(data.quotaSettings)
            : data.quotaSettings;
          setQuotaSettings(parsed);
        }
        // Load Dynata settings
        setDynataEnabled(data.dynataEnabled ?? false);
        setDynataReturnUrl(data.dynataReturnUrl ?? "");
        setDynataBasicCode(data.dynataBasicCode ?? "");
        setTimeout(() => {
          initialLoadRef.current = false;
        }, 100);
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Failed to fetch form:", error);
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  }, [formId, router]);

  useEffect(() => {
    fetchForm();
  }, [fetchForm]);

  const saveFormSettings = useCallback(async () => {
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/forms/${formId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          brandColor,
          isPublished,
          articlesPerSession,
          sessionTimeoutMins,
          quotaSettings,
          dynataEnabled,
          dynataReturnUrl: dynataReturnUrl || null,
          dynataBasicCode: dynataBasicCode || null,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setForm((prev) => (prev ? { ...updated, _count: prev._count } : updated));
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      }
    } catch (error) {
      console.error("Failed to save form:", error);
      setSaveStatus("idle");
    }
  }, [formId, title, description, brandColor, isPublished, articlesPerSession, sessionTimeoutMins, quotaSettings, dynataEnabled, dynataReturnUrl, dynataBasicCode]);

  useEffect(() => {
    if (initialLoadRef.current) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveFormSettings();
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, description, brandColor, articlesPerSession, sessionTimeoutMins, quotaSettings, dynataEnabled, dynataReturnUrl, dynataBasicCode, saveFormSettings]);

  const addQuestion = async (type: string) => {
    try {
      const defaultOptions =
        isChoiceType(type)
          ? [
              { label: "Option 1" },
              { label: "Option 2" },
              { label: "Option 3" },
            ]
          : undefined;

      // Set default title based on type
      let defaultTitle = "Your question here";
      let defaultSettings = undefined;
      let insertAfter = undefined;

      if (type === "INFORMED_CONSENT") {
        defaultTitle = "Informed Consent";
        defaultSettings = DEFAULT_CONSENT_SETTINGS;
        // Insert INFORMED_CONSENT right after WELCOME_SCREEN
        const welcomeScreen = form?.questions.find((q) => q.type === "WELCOME_SCREEN");
        if (welcomeScreen) {
          insertAfter = welcomeScreen.id;
        }
      }

      if (type === "TEXT_ANNOTATION") {
        defaultTitle = "Text Annotation";
        defaultSettings = DEFAULT_ANNOTATION_SETTINGS;
      }

      if (type === "DEMOGRAPHICS") {
        defaultTitle = "Demographics";
        defaultSettings = DEFAULT_DEMOGRAPHICS_SETTINGS;
        // Insert DEMOGRAPHICS after INFORMED_CONSENT
        const informedConsent = form?.questions.find((q) => q.type === "INFORMED_CONSENT");
        if (informedConsent) {
          insertAfter = informedConsent.id;
        } else {
          // If no informed consent, insert after WELCOME_SCREEN
          const welcomeScreen = form?.questions.find((q) => q.type === "WELCOME_SCREEN");
          if (welcomeScreen) {
            insertAfter = welcomeScreen.id;
          }
        }
      }

      const res = await fetch(`/api/forms/${formId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: defaultTitle,
          isRequired: false,
          options: defaultOptions,
          settings: defaultSettings,
          insertAfter,
        }),
      });

      if (res.ok) {
        await fetchForm();
      }
    } catch (error) {
      console.error("Failed to add question:", error);
    }
    setShowAddMenu(false);
  };

  const updateQuestion = async (
    questionId: string,
    updates: QuestionUpdatePayload
  ) => {
    try {
      const res = await fetch(`/api/forms/${formId}/questions/${questionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const updatedQuestion = await res.json();
        setForm((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            questions: prev.questions.map((q) =>
              q.id === questionId ? { ...q, ...updatedQuestion } : q
            ),
          };
        });
      }
    } catch (error) {
      console.error("Failed to update question:", error);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm("Delete this question?")) return;

    try {
      const res = await fetch(`/api/forms/${formId}/questions/${questionId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSelectedQuestion(null);
        await fetchForm();
      }
    } catch (error) {
      console.error("Failed to delete question:", error);
    }
  };

  const handleReorder = async (newOrder: Question[]) => {
    if (!form) return;

    const updatedQuestions = [
      ...(form.questions.filter(
        (q) => q.type === "WELCOME_SCREEN"
      ) || []),
      ...(form.questions.filter(
        (q) => q.type === "INFORMED_CONSENT"
      ) || []),
      ...newOrder,
      ...(form.questions.filter(
        (q) => q.type === "THANK_YOU_SCREEN"
      ) || []),
    ];

    setForm({
      ...form,
      questions: updatedQuestions,
    });

    try {
      await fetch(`/api/forms/${formId}/questions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionIds: newOrder.map((q) => q.id),
        }),
      });
    } catch (error) {
      console.error("Failed to reorder questions:", error);
      await fetchForm();
    }
  };

  const togglePublish = async () => {
    const newStatus = !isPublished;
    setIsPublished(newStatus);

    try {
      await fetch(`/api/forms/${formId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: newStatus }),
      });
      await fetchForm();
    } catch (error) {
      console.error("Failed to toggle publish:", error);
      setIsPublished(!newStatus);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-chili-coral" />
      </div>
    );
  }

  if (!form) {
    return null;
  }

  const regularQuestions = form.questions.filter(
    (q) => q.type !== "WELCOME_SCREEN" && q.type !== "THANK_YOU_SCREEN" && q.type !== "INFORMED_CONSENT" && q.type !== "DEMOGRAPHICS"
  );
  const welcomeScreen = form.questions.find((q) => q.type === "WELCOME_SCREEN");
  const informedConsent = form.questions.find((q) => q.type === "INFORMED_CONSENT");
  const demographics = form.questions.find((q) => q.type === "DEMOGRAPHICS");
  const thankYouScreen = form.questions.find(
    (q) => q.type === "THANK_YOU_SCREEN"
  );

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
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
                onChange={(e) => setTitle(e.target.value)}
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
              onClick={() => setShowSettings(!showSettings)}
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
            <Button onClick={togglePublish}>
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

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-6">
            <h3 className="font-semibold text-obsidian">Form Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-obsidian mb-1">
                  Description
                </label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
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
                    onChange={(e) => setArticlesPerSession(parseInt(e.target.value) || 20)}
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
                    onChange={(e) => setSessionTimeoutMins(parseInt(e.target.value) || 10)}
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
                    onChange={(e) => setQuotaSettings(prev => ({
                      ...prev,
                      groups: {
                        ...prev.groups,
                        dutch: { ...prev.groups.dutch, target: parseInt(e.target.value) || 1 }
                      }
                    }))}
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
                    onChange={(e) => setQuotaSettings(prev => ({
                      ...prev,
                      groups: {
                        ...prev.groups,
                        minority: { ...prev.groups.minority, target: parseInt(e.target.value) || 2 }
                      }
                    }))}
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
                    onChange={(e) => setDynataEnabled(e.target.checked)}
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
                      onChange={(e) => setDynataReturnUrl(e.target.value)}
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
                      onChange={(e) => setDynataBasicCode(e.target.value)}
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
            <ArticleImportSection formId={formId} onImport={fetchForm} articleCount={form._count?.articles || 0} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Questions List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Welcome Screen */}
            {welcomeScreen && (
              <div
                className={`bg-white rounded-xl border-2 p-6 cursor-pointer transition-colors ${
                  selectedQuestion === welcomeScreen.id
                    ? "border-chili-coral"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedQuestion(welcomeScreen.id)}
              >
                <div className="flex items-center gap-2 text-sm text-obsidian-muted mb-2">
                  <Play className="w-4 h-4" />
                  Welcome Screen
                </div>
                <h3 className="font-semibold text-obsidian">
                  {welcomeScreen.title}
                </h3>
                {welcomeScreen.description && (
                  <p className="text-sm text-obsidian-muted mt-1">
                    {welcomeScreen.description}
                  </p>
                )}
              </div>
            )}

            {/* Informed Consent Screen */}
            {informedConsent && (
              <div
                className={`bg-white rounded-xl border-2 p-6 cursor-pointer transition-colors ${
                  selectedQuestion === informedConsent.id
                    ? "border-chili-coral"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedQuestion(informedConsent.id)}
              >
                <div className="flex items-center gap-2 text-sm text-obsidian-muted mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  Informed Consent
                </div>
                <h3 className="font-semibold text-obsidian">
                  {informedConsent.title}
                </h3>
                {informedConsent.description && (
                  <p className="text-sm text-obsidian-muted mt-1">
                    {informedConsent.description}
                  </p>
                )}
              </div>
            )}

            {/* Demographics Screen */}
            {demographics && (
              <div
                className={`bg-white rounded-xl border-2 p-6 cursor-pointer transition-colors ${
                  selectedQuestion === demographics.id
                    ? "border-chili-coral"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedQuestion(demographics.id)}
              >
                <div className="flex items-center gap-2 text-sm text-obsidian-muted mb-2">
                  <Users className="w-4 h-4" />
                  Demographics
                </div>
                <h3 className="font-semibold text-obsidian">
                  {demographics.title}
                </h3>
                {demographics.description && (
                  <p className="text-sm text-obsidian-muted mt-1">
                    {demographics.description}
                  </p>
                )}
              </div>
            )}

            {/* Regular Questions - Drag and Drop */}
            <Reorder.Group
              axis="y"
              values={regularQuestions}
              onReorder={handleReorder}
              className="space-y-4"
            >
              {regularQuestions.map((question, index) => {
                const typeConfig = questionTypes.find(
                  (t) => t.type === question.type
                );
                const Icon = typeConfig?.icon || Type;

                return (
                  <Reorder.Item
                    key={question.id}
                    value={question}
                    className={`bg-white rounded-xl border-2 p-6 cursor-grab active:cursor-grabbing transition-colors ${
                      selectedQuestion === question.id
                        ? "border-chili-coral"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedQuestion(question.id)}
                    whileDrag={{
                      scale: 1.02,
                      boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 text-gray-400 mt-1">
                        <GripVertical className="w-4 h-4" />
                        <span className="text-sm font-medium">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm text-obsidian-muted mb-2">
                          <Icon className="w-4 h-4" />
                          {typeConfig?.label || question.type}
                          {question.isRequired && (
                            <span className="text-red-500">*</span>
                          )}
                        </div>
                        <h3 className="font-medium text-obsidian">
                          {question.title}
                        </h3>
                        {question.description && (
                          <p className="text-sm text-obsidian-muted mt-1">
                            {question.description}
                          </p>
                        )}
                        {isChoiceType(question.type) &&
                          question.options.length > 0 && (
                            <div className="mt-3 space-y-1">
                              {question.options.map((opt) => (
                                <div
                                  key={opt.id}
                                  className="text-sm text-obsidian-muted flex items-center gap-2"
                                >
                                  <div className="w-4 h-4 border border-gray-300 rounded" />
                                  {opt.label}
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>

            {/* Add Question Button */}
            <div className="relative">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-obsidian-muted hover:border-chili-coral hover:text-chili-coral transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Question
              </button>
              {showAddMenu && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-2 z-10 grid grid-cols-2 gap-1">
                  {questionTypes.map(({ type, label, icon: Icon }) => (
                    <button
                      key={type}
                      onClick={() => addQuestion(type)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-obsidian"
                    >
                      <Icon className="w-4 h-4 text-gray-400" />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Thank You Screen */}
            {thankYouScreen && (
              <div
                className={`bg-white rounded-xl border-2 p-6 cursor-pointer transition-colors ${
                  selectedQuestion === thankYouScreen.id
                    ? "border-chili-coral"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedQuestion(thankYouScreen.id)}
              >
                <div className="flex items-center gap-2 text-sm text-obsidian-muted mb-2">
                  <Heart className="w-4 h-4" />
                  Thank You Screen
                </div>
                <h3 className="font-semibold text-obsidian">
                  {thankYouScreen.title}
                </h3>
                {thankYouScreen.description && (
                  <p className="text-sm text-obsidian-muted mt-1">
                    {thankYouScreen.description}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Question Editor Sidebar */}
          <div className="lg:col-span-1">
            {selectedQuestion ? (
              <QuestionEditor
                key={selectedQuestion}
                question={form.questions.find((q) => q.id === selectedQuestion)!}
                onUpdate={(updates) => updateQuestion(selectedQuestion, updates)}
                onDelete={() => deleteQuestion(selectedQuestion)}
                articleCount={form._count?.articles || 0}
                articlesPerSession={articlesPerSession}
              />
            ) : (
              <div className="bg-gray-50 rounded-xl p-6 text-center text-obsidian-muted">
                <p>Select a question to edit</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Article Import Section Component
function ArticleImportSection({
  formId,
  onImport,
  articleCount,
}: {
  formId: string;
  onImport: () => void;
  articleCount: number;
}) {
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

    try {
      const res = await fetch(`/api/forms/${formId}/articles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvData }),
      });

      const data = await res.json();

      if (res.ok) {
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
          message: data.error || "Failed to import articles",
        });
      }
    } catch (error) {
      setImportStatus({
        type: "error",
        message: "Failed to import articles",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClearArticles = async () => {
    if (!confirm("Are you sure you want to delete all articles? This cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/forms/${formId}/articles`, {
        method: "DELETE",
      });

      if (res.ok) {
        setImportStatus({
          type: "success",
          message: "All articles deleted successfully",
        });
        onImport();
      }
    } catch (error) {
      setImportStatus({
        type: "error",
        message: "Failed to delete articles",
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
            CSV must have &quot;text&quot; (or &quot;tekst&quot;) and &quot;ARTICLE_SHORT_ID&quot; columns
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
}

function QuestionEditor({
  question,
  onUpdate,
  onDelete,
  articleCount = 0,
  articlesPerSession = 20,
}: {
  question: Question;
  onUpdate: (updates: QuestionUpdatePayload) => void;
  onDelete: () => void;
  articleCount?: number;
  articlesPerSession?: number;
}) {
  const [title, setTitle] = useState(question.title);
  const [description, setDescription] = useState(question.description || "");
  const [placeholder, setPlaceholder] = useState(question.placeholder || "");
  const [isRequired, setIsRequired] = useState(question.isRequired);
  const [options, setOptions] = useState(question.options);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);

  // Reset initialLoadRef after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      initialLoadRef.current = false;
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (initialLoadRef.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus("saving");
      onUpdate({
        title,
        description: description || null,
        placeholder: placeholder || null,
        isRequired,
        options: isChoiceType(question.type)
          ? options.map((o) => ({ label: o.label, value: o.value }))
          : undefined,
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, description, placeholder, isRequired, options, question.type, onUpdate]);

  const isScreen =
    question.type === "WELCOME_SCREEN" || question.type === "THANK_YOU_SCREEN" || question.type === "INFORMED_CONSENT" || question.type === "DEMOGRAPHICS";

  const isInformedConsent = question.type === "INFORMED_CONSENT";
  const isTextAnnotation = question.type === "TEXT_ANNOTATION";
  const isDemographics = question.type === "DEMOGRAPHICS";

  // Handle informed consent settings update
  const handleConsentSettingsUpdate = (consentSettings: InformedConsentSettings) => {
    onUpdate({
      title,
      description: description || null,
      settings: consentSettings as unknown as Record<string, unknown>,
    });
  };

  // Handle text annotation settings update
  const handleAnnotationSettingsUpdate = (annotationSettings: TextAnnotationSettings) => {
    onUpdate({
      title,
      description: description || null,
      settings: annotationSettings as unknown as Record<string, unknown>,
    });
  };

  // Handle demographics settings update
  const handleDemographicsSettingsUpdate = (demographicsSettings: DemographicsSettings) => {
    onUpdate({
      title,
      description: description || null,
      settings: demographicsSettings as unknown as Record<string, unknown>,
    });
  };

  // Special editor for Informed Consent
  if (isInformedConsent) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <div>
          <label className="block text-sm font-medium text-obsidian mb-1">
            Consent Title
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Informed Consent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-obsidian mb-1">
            Introduction Text
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief introduction to the consent form"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-chili-coral text-sm"
            rows={2}
          />
        </div>

        <InformedConsentEditor
          settings={(question.settings as unknown as InformedConsentSettings) || DEFAULT_CONSENT_SETTINGS}
          onUpdate={handleConsentSettingsUpdate}
        />
      </div>
    );
  }

  // Special editor for Text Annotation
  if (isTextAnnotation) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-obsidian">Edit Annotation</h3>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-obsidian mb-1">
            Question Title
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Text Annotation"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-obsidian mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Instructions for the annotation task"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-chili-coral text-sm"
            rows={2}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="annotation-required"
            checked={isRequired}
            onChange={(e) => setIsRequired(e.target.checked)}
            className="rounded border-gray-300 text-chili-coral focus:ring-chili-coral"
          />
          <label htmlFor="annotation-required" className="text-sm text-obsidian">
            Required
          </label>
        </div>

        <AnnotationEditor
          settings={(question.settings as unknown as TextAnnotationSettings) || DEFAULT_ANNOTATION_SETTINGS}
          onUpdate={handleAnnotationSettingsUpdate}
          articleCount={articleCount}
          articlesPerSession={articlesPerSession}
        />
      </div>
    );
  }

  // Special editor for Demographics
  if (isDemographics) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-obsidian">Edit Demographics</h3>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-obsidian mb-1">
            Section Title
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Demographics"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-obsidian mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief introduction to the demographics section"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-chili-coral text-sm"
            rows={2}
          />
        </div>

        <DemographicsEditor
          settings={(question.settings as unknown as DemographicsSettings) || DEFAULT_DEMOGRAPHICS_SETTINGS}
          onUpdate={handleDemographicsSettingsUpdate}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 sticky top-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-obsidian">Edit Question</h3>
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <Check className="w-3 h-3" />
              Saved
            </span>
          )}
        </div>
        {!isScreen && (
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-obsidian mb-1">
          {isScreen ? "Heading" : "Question"}
        </label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={isScreen ? "Heading text" : "Your question"}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-obsidian mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional helper text"
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-chili-coral text-sm"
          rows={2}
        />
      </div>

      {!isScreen && (
        <>
          <div>
            <label className="block text-sm font-medium text-obsidian mb-1">
              Placeholder
            </label>
            <Input
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
              placeholder="Placeholder text"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="required"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
              className="rounded border-gray-300 text-chili-coral focus:ring-chili-coral"
            />
            <label htmlFor="required" className="text-sm text-obsidian">
              Required
            </label>
          </div>

          {isChoiceType(question.type) && (
            <div>
              <label className="block text-sm font-medium text-obsidian mb-2">
                Options
              </label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <Input
                      value={option.label}
                      onChange={(e) => {
                        const newOptions = [...options];
                        newOptions[index] = {
                          ...option,
                          label: e.target.value,
                          value: e.target.value,
                        };
                        setOptions(newOptions);
                      }}
                      className="flex-1"
                    />
                    <button
                      onClick={() => {
                        setOptions(options.filter((_, i) => i !== index));
                      }}
                      className="p-1 hover:bg-gray-100 rounded text-gray-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    setOptions([
                      ...options,
                      {
                        id: `new-${Date.now()}`,
                        label: `Option ${options.length + 1}`,
                        value: `Option ${options.length + 1}`,
                        displayOrder: options.length,
                      },
                    ]);
                  }}
                  className="text-sm text-chili-coral hover:underline"
                >
                  + Add option
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
