"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  progress: number;
  brandColor: string;
}

export const ProgressBar = ({ progress, brandColor }: ProgressBarProps) => (
  <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50">
    <motion.div
      className="h-full"
      style={{ backgroundColor: brandColor }}
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      transition={{ duration: 0.3 }}
    />
  </div>
);
