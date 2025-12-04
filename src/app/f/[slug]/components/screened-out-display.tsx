"use client";

import { AlertCircle } from "lucide-react";

interface ScreenedOutDisplayProps {
  reason: string | null;
  returnUrl: string | null;
}

export const ScreenedOutDisplay = ({
  reason,
  returnUrl,
}: ScreenedOutDisplayProps) => (
  <div className="min-h-screen bg-canvas flex flex-col">
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="text-center max-w-md">
        <AlertCircle className="w-16 h-16 mx-auto mb-6 text-amber-500" />
        <h1 className="text-2xl font-display font-bold text-obsidian mb-4">
          {reason === "quota_full"
            ? "Thank you for your interest"
            : "Session could not be continued"}
        </h1>
        <p className="text-obsidian-muted">
          {reason === "quota_full"
            ? "Unfortunately, we have already collected enough responses from participants with your profile. Thank you for your willingness to participate."
            : "There was an issue with your session. Please contact the researcher if you believe this is an error."}
        </p>
        {returnUrl && (
          <p className="mt-4 text-sm text-gray-500">
            You will be redirected shortly...
          </p>
        )}
      </div>
    </main>
  </div>
);
