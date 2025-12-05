import { motion } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";

interface TransitionPhaseProps {
  brandColor: string;
  textsCount: number;
  onStartMain: () => void;
}

export const TransitionPhase = ({
  brandColor,
  textsCount,
  onStartMain,
}: TransitionPhaseProps) => {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: brandColor }}
        >
          <Check className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-display font-bold text-obsidian mb-4">
          Practice Complete!
        </h2>
        <p className="text-obsidian-muted mb-8 max-w-md mx-auto">
          Great job! You&apos;ve completed the practice round. Now you&apos;ll start annotating the actual texts.
          There are {textsCount} texts to annotate.
        </p>
        <button
          onClick={onStartMain}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all cursor-pointer hover:brightness-110 active:brightness-90"
          style={{ backgroundColor: brandColor }}
        >
          Start Main Task
          <ChevronRight className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  );
};
