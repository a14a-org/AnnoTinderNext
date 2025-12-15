'use client'

import type { InstructionsSettings } from '../instructions'

import { useState, useEffect, useCallback } from 'react'
import { BookOpen, Check, ChevronRight } from 'lucide-react'
import Markdown from 'react-markdown'

import { DEFAULT_INSTRUCTIONS_SETTINGS } from '../instructions'

interface InstructionsDisplayProps {
  title: string
  description: string | null | undefined
  settings: InstructionsSettings | null
  brandColor: string
  onContinue: () => void
}

export const InstructionsDisplay = ({
  title,
  description,
  settings: rawSettings,
  brandColor,
  onContinue,
}: InstructionsDisplayProps) => {
  const settings = rawSettings ?? DEFAULT_INSTRUCTIONS_SETTINGS
  const [isChecked, setIsChecked] = useState(false)

  const showCheckbox = settings.showCheckbox ?? true
  const canContinue = !showCheckbox || isChecked

  const handleContinue = useCallback(() => {
    if (canContinue) {
      onContinue()
    }
  }, [canContinue, onContinue])

  const toggleCheckbox = useCallback(() => {
    setIsChecked((prev) => !prev)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1' && showCheckbox) {
        e.preventDefault()
        toggleCheckbox()
        return
      }

      if (e.key === 'Enter' && canContinue) {
        e.preventDefault()
        handleContinue()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showCheckbox, toggleCheckbox, canContinue, handleContinue])

  const displayTitle = settings.title ?? title

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: `${brandColor}20` }}
        >
          <BookOpen className="w-8 h-8" style={{ color: brandColor }} />
        </div>
        <h1 className="text-3xl font-display font-bold text-obsidian mb-2">{displayTitle}</h1>
        {description && <p className="text-lg text-obsidian-muted">{description}</p>}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 max-h-[50vh] overflow-y-auto">
        <div className="prose prose-sm max-w-none prose-headings:text-obsidian prose-p:text-obsidian-muted prose-strong:text-obsidian prose-li:text-obsidian-muted">
          <Markdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-2xl font-display font-bold text-obsidian mt-6 first:mt-0 mb-4">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl font-display font-semibold text-obsidian mt-6 first:mt-0 mb-3">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-lg font-semibold text-obsidian mt-4 first:mt-0 mb-2">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="text-obsidian-muted mb-3 leading-relaxed">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside mb-4 space-y-1 text-obsidian-muted">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside mb-4 space-y-1 text-obsidian-muted">
                  {children}
                </ol>
              ),
              li: ({ children }) => <li className="text-obsidian-muted">{children}</li>,
              strong: ({ children }) => (
                <strong className="font-semibold text-obsidian">{children}</strong>
              ),
              em: ({ children }) => <em className="italic">{children}</em>,
              hr: () => <hr className="my-6 border-gray-200" />,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-gray-300 pl-4 italic text-obsidian-muted my-4">
                  {children}
                </blockquote>
              ),
            }}
          >
            {settings.content}
          </Markdown>
        </div>
      </div>

      {showCheckbox && (
        <div className="mb-6">
          <button
            onClick={toggleCheckbox}
            className={`w-full p-4 text-left rounded-xl border-2 transition-all flex items-center gap-3 ${
              isChecked
                ? 'border-current bg-opacity-10'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            style={{
              borderColor: isChecked ? brandColor : undefined,
              backgroundColor: isChecked ? `${brandColor}15` : undefined,
            }}
          >
            <span
              className="w-8 h-8 rounded-lg border-2 flex items-center justify-center text-sm font-medium shrink-0"
              style={{
                borderColor: isChecked ? brandColor : '#D1D5DB',
                backgroundColor: isChecked ? brandColor : undefined,
              }}
            >
              {isChecked ? (
                <Check className="w-5 h-5 text-white" />
              ) : (
                <span className="text-gray-400">1</span>
              )}
            </span>
            <span className={`${isChecked ? 'text-obsidian' : 'text-obsidian-muted'}`}>
              {settings.checkboxLabel ?? DEFAULT_INSTRUCTIONS_SETTINGS.checkboxLabel}
            </span>
          </button>
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={!canContinue}
        className={`w-full p-4 text-left rounded-xl border-2 transition-all flex items-center gap-3 ${
          canContinue
            ? 'border-current hover:brightness-105'
            : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
        }`}
        style={{
          borderColor: canContinue ? brandColor : undefined,
          backgroundColor: canContinue ? `${brandColor}15` : undefined,
        }}
      >
        <span
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0`}
          style={{
            backgroundColor: canContinue ? brandColor : '#D1D5DB',
          }}
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </span>
        <span className={`font-medium ${canContinue ? 'text-obsidian' : 'text-gray-400'}`}>
          {settings.buttonText ?? DEFAULT_INSTRUCTIONS_SETTINGS.buttonText}
        </span>
        {canContinue && (
          <kbd className="ml-auto px-2 py-1 bg-white rounded shadow text-xs text-gray-500">
            Enter
          </kbd>
        )}
      </button>

      <div className="text-center mt-6 text-sm text-obsidian-muted">
        {showCheckbox && (
          <>
            Press <kbd className="px-2 py-1 bg-white rounded shadow text-xs">1</kbd> to toggle
            checkbox ·{' '}
          </>
        )}
        <kbd className="px-2 py-1 bg-white rounded shadow text-xs">Enter</kbd> to continue
      </div>
    </div>
  )
}
