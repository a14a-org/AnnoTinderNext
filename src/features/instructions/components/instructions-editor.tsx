'use client'

import type { InstructionsSettings } from '../instructions'

import { useState } from 'react'

import { DEFAULT_INSTRUCTIONS_SETTINGS } from '../instructions'

export interface InstructionsEditorProps {
  settings: InstructionsSettings
  onUpdate: (settings: InstructionsSettings) => void
}

export const InstructionsEditor = ({ settings, onUpdate }: InstructionsEditorProps) => {
  // Use a key-based approach: derive initial state from props
  // Updates flow down via onUpdate callback, not via prop syncing
  const [localState, setLocalState] = useState(() => ({
    content: settings.content,
    buttonText: settings.buttonText ?? DEFAULT_INSTRUCTIONS_SETTINGS.buttonText,
    showCheckbox: settings.showCheckbox ?? true,
    checkboxLabel: settings.checkboxLabel ?? DEFAULT_INSTRUCTIONS_SETTINGS.checkboxLabel,
  }))

  const handleUpdate = <K extends keyof typeof localState>(
    key: K,
    value: typeof localState[K]
  ) => {
    const newState = { ...localState, [key]: value }
    setLocalState(newState)
    onUpdate({
      ...settings,
      content: newState.content,
      buttonText: newState.buttonText,
      showCheckbox: newState.showCheckbox,
      checkboxLabel: newState.checkboxLabel,
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-obsidian mb-1">
          Instructions Content (Markdown)
        </label>
        <p className="text-xs text-obsidian-muted mb-2">
          Supports **bold**, *italic*, ## headers, - lists, and more
        </p>
        <textarea
          value={localState.content}
          onChange={(e) => handleUpdate('content', e.target.value)}
          placeholder="Enter your instructions using Markdown formatting..."
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-chili-coral text-sm font-mono"
          rows={12}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="show-checkbox"
          checked={localState.showCheckbox}
          onChange={(e) => handleUpdate('showCheckbox', e.target.checked)}
          className="rounded border-gray-300 text-chili-coral focus:ring-chili-coral"
        />
        <label htmlFor="show-checkbox" className="text-sm text-obsidian">
          Require confirmation checkbox
        </label>
      </div>

      {localState.showCheckbox && (
        <div>
          <label className="block text-sm font-medium text-obsidian mb-1">
            Checkbox Label
          </label>
          <input
            type="text"
            value={localState.checkboxLabel}
            onChange={(e) => handleUpdate('checkboxLabel', e.target.value)}
            placeholder="Ik heb de instructies gelezen en begrepen"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-chili-coral text-sm"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-obsidian mb-1">
          Continue Button Text
        </label>
        <input
          type="text"
          value={localState.buttonText}
          onChange={(e) => handleUpdate('buttonText', e.target.value)}
          placeholder="Ik heb de instructies gelezen"
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-chili-coral text-sm"
        />
      </div>
    </div>
  )
}
