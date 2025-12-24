import { useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Markdown from "react-markdown";

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
          <span>Instructies</span>
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
            <div className="px-4 pb-4 pt-2 text-sm leading-relaxed border-t border-blue-100/50 mt-1 max-h-[60vh] overflow-y-auto">
              <div className="prose prose-sm max-w-none prose-headings:text-blue-900 prose-p:text-blue-900/80 prose-strong:text-blue-900 prose-li:text-blue-900/80">
                <Markdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-lg font-display font-bold text-blue-900 mt-4 first:mt-0 mb-3">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-base font-display font-semibold text-blue-900 mt-4 first:mt-0 mb-2">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-sm font-semibold text-blue-900 mt-3 first:mt-0 mb-2">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-blue-900/80 mb-2 leading-relaxed">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside mb-3 space-y-1 text-blue-900/80">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside mb-3 space-y-1 text-blue-900/80">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => <li className="text-blue-900/80">{children}</li>,
                    strong: ({ children }) => (
                      <strong className="font-semibold text-blue-900">{children}</strong>
                    ),
                    em: ({ children }) => <em className="italic">{children}</em>,
                    hr: () => <hr className="my-4 border-blue-200" />,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-blue-300 pl-3 italic text-blue-900/70 my-3">
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {instructionText}
                </Markdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
