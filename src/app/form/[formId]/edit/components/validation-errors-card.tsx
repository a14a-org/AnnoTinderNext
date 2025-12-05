"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui";

interface ValidationErrorsCardProps {
  errorCount: number;
  onPublishAnyway: () => void;
}

export const ValidationErrorsCard = ({
  errorCount,
  onPublishAnyway,
}: ValidationErrorsCardProps) => {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between animate-in slide-in-from-top-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="font-medium text-amber-900">
            {errorCount} question{errorCount !== 1 ? "s" : ""} found with issues
          </h3>
          <p className="text-sm text-amber-700">
            Some questions are missing titles or options.
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        onClick={onPublishAnyway}
        className="text-amber-800 hover:bg-amber-100 hover:text-amber-900"
      >
        Publish Anyway
      </Button>
    </div>
  );
};

