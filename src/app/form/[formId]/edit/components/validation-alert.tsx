"use client";

import { AlertCircle, ArrowRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui";

interface ValidationAlertProps {
  issueCount: number;
  onPublishAnyway: () => void;
  onDismiss: () => void;
}

export const ValidationAlert = ({
  issueCount,
  onPublishAnyway,
  onDismiss,
}: ValidationAlertProps) => {
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
                {issueCount} {issueCount === 1 ? "issue" : "issues"} found
              </h3>
              <p className="text-sm text-amber-700">
                Some questions are missing titles or options.
              </p>
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
