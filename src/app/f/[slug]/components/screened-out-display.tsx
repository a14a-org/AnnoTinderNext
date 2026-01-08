"use client";

import { AlertCircle } from "lucide-react";

interface ScreenedOutDisplayProps {
  reason: string | null;
  returnUrl: string | null;
  willRedirect: boolean;
}

const getScreenedOutContent = (reason: string | null): { title: string; message: string } => {
  switch (reason) {
    case "quota_full":
      return {
        title: "Bedankt voor je interesse",
        message: "Helaas hebben we al voldoende reacties verzameld van deelnemers met jouw profiel. Bedankt voor je bereidheid om deel te nemen.",
      };
    case "under_age":
      return {
        title: "Leeftijdsvereiste niet behaald",
        message: "Je moet minimaal 18 jaar oud zijn om deel te nemen aan dit onderzoek. Bedankt voor je interesse.",
      };
    case "no_matching_group":
      return {
        title: "Bedankt voor je interesse",
        message: "Helaas kom je niet in aanmerking voor deelname aan dit onderzoek. Bedankt voor je bereidheid om deel te nemen.",
      };
    default:
      return {
        title: "Sessie kon niet worden voortgezet",
        message: "Er is een probleem opgetreden met je sessie. Neem contact op met de onderzoeker als je denkt dat dit een fout is.",
      };
  }
};

export const ScreenedOutDisplay = ({
  reason,
  returnUrl,
  willRedirect = false,
}: ScreenedOutDisplayProps) => {
  const content = getScreenedOutContent(reason);
  const showRedirectMessage = willRedirect || returnUrl;

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto mb-6 text-amber-500" />
          <h1 className="text-2xl font-display font-bold text-obsidian mb-4">
            {content.title}
          </h1>
          <p className="text-obsidian-muted">
            {content.message}
          </p>
          {showRedirectMessage && (
            <p className="mt-4 text-sm text-gray-500">
              Je wordt zo doorgestuurd...
            </p>
          )}
        </div>
      </main>
    </div>
  );
};
