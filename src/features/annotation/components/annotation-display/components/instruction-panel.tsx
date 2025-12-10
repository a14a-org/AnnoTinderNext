import { useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface InstructionPanelProps {
  instructionText: string;
  defaultOpen?: boolean;
}

export const InstructionPanel = ({ 
  instructionText, 
  defaultOpen = false 
}: InstructionPanelProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!instructionText) return null;

  return (
    <div className="mb-6 bg-blue-50 border border-blue-100 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-blue-100/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-blue-800 font-medium text-sm">
          <Info className="w-4 h-4" />
          <span>Instructions</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-blue-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-blue-600" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4 pt-0 text-sm text-blue-900/80 leading-relaxed whitespace-pre-wrap border-t border-blue-100/50 mt-1">
              {instructionText}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
