"use client";

import { AlertCircle, ArrowRight, X } from "lucide-react";
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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-20 left-0 right-0 z-50 px-6 pointer-events-none"
      >
        <div className="max-w-3xl mx-auto bg-amber-50 border border-amber-200 shadow-lg rounded-xl p-4 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium text-amber-900">
                {issueCount > 0 || errors.length > 0 ? "Form is incomplete" : "Ready to publish"}
              </h3>
              <div className="text-sm text-amber-700">
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
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={onPublishAnyway}
              className="text-amber-700 hover:bg-amber-100 hover:text-amber-900"
            >
              Publish anyway
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <button
              onClick={onDismiss}
              className="p-2 hover:bg-amber-100 rounded-lg text-amber-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
