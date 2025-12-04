"use client";

import { Check } from "lucide-react";

interface FormCompleteDisplayProps {
  brandColor: string;
}

export const FormCompleteDisplay = ({
  brandColor,
}: FormCompleteDisplayProps) => (
  <div className="text-center">
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
      style={{ backgroundColor: brandColor }}
    >
      <Check className="w-8 h-8 text-white" />
    </div>
    <h1 className="text-4xl font-display font-bold text-obsidian mb-4">
      Thank you!
    </h1>
    <p className="text-lg text-obsidian-muted">
      Your response has been submitted successfully.
    </p>
  </div>
);
