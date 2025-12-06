"use client";

import { AlertCircle, ArrowRight, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui";

interface ValidationAlertProps {
  issueCount: number;
  errors?: string[];
  invalidQuestions?: string[];
  onPublishAnyway: () => void;
  onDismiss: () => void;
  onSelectQuestion?: (id: string) => void;
}

export const ValidationAlert = ({
  issueCount,
  errors = [],
  invalidQuestions = [],
  onPublishAnyway,
  onDismiss,
  onSelectQuestion,
}: ValidationAlertProps) => {
  const scrollToQuestion = () => {
    if (invalidQuestions.length > 0) {
      const firstInvalidId = invalidQuestions[0];
      
      if (onSelectQuestion) {
        onSelectQuestion(firstInvalidId);
      }

      // Small delay to allow selection state to update before scrolling (if needed)
      // or just scroll immediately
      setTimeout(() => {
        const element = document.getElementById(`question-${firstInvalidId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const hasIssues = issueCount > 0 || errors.length > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-20 left-0 right-0 z-50 px-6 pointer-events-none"
      >
        <div className={`max-w-3xl mx-auto border shadow-lg rounded-xl p-4 flex items-center justify-between pointer-events-auto ${
          hasIssues ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              hasIssues ? "bg-amber-100" : "bg-emerald-100"
            }`}>
              {hasIssues ? (
                <AlertCircle className="w-5 h-5 text-amber-600" />
              ) : (
                <Check className="w-5 h-5 text-emerald-600" />
              )}
            </div>
            <div>
              <h3 className={`font-medium ${hasIssues ? "text-amber-900" : "text-emerald-900"}`}>
                {hasIssues ? "Form is incomplete" : "Ready to publish"}
              </h3>
              <div className={`text-sm ${hasIssues ? "text-amber-700" : "text-emerald-700"}`}>
                {errors.length > 0 && (
                   <ul className="list-disc list-inside mb-1">
                     {errors.map((err, i) => (
                       <li key={i}>{err}</li>
                     ))}
                   </ul>
                )}
                {issueCount > 0 && (
                  <button 
                    onClick={scrollToQuestion}
                    className="font-medium text-amber-800 hover:text-amber-900 hover:underline cursor-pointer pointer-events-auto flex items-center gap-1"
                  >
                    Go to first issue <ArrowRight className="w-3 h-3" />
                  </button>
                )}
                {!hasIssues && (
                  <p>All checks passed. Your form is ready to go live.</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={onPublishAnyway}
              className={hasIssues 
                ? "text-amber-700 hover:bg-amber-100 hover:text-amber-900"
                : "text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900"
              }
            >
              {hasIssues ? "Publish anyway" : "Publish now"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <button
              onClick={onDismiss}
              className={`p-2 rounded-lg transition-colors ${
                hasIssues 
                  ? "hover:bg-amber-100 text-amber-500" 
                  : "hover:bg-emerald-100 text-emerald-500"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
