'use client'

import type { DemographicsSettings, DemographicField, SliderConfig } from '../demographics'

import { useState, useEffect, useRef } from 'react'
import { Loader2, Check, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

import { Input } from '@/components/ui'
import { DEFAULT_DEMOGRAPHICS_SETTINGS } from '../demographics'

export interface DemographicsEditorProps {
  settings: DemographicsSettings | null
  onUpdate: (settings: DemographicsSettings) => void
}

interface SectionHeaderProps {
  title: string
  section: string
  expanded: boolean
  onToggle: (section: string) => void
}

const SectionHeader = ({ title, section, expanded, onToggle }: SectionHeaderProps) => (
  <button
    type="button"
    onClick={() => onToggle(section)}
    className="flex items-center justify-between w-full py-2 text-sm font-semibold text-obsidian hover:text-chili-coral transition-colors"
  >
    {title}
    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
  </button>
)

const FIELD_TYPE_OPTIONS = [
  { value: 'single_choice', label: 'Single Choice' },
  { value: 'single_choice_other', label: 'Single Choice + Other' },
  { value: 'text', label: 'Text Input' },
  { value: 'slider', label: 'Slider' },
  { value: 'month_year', label: 'Month/Year' },
] as const

const DEFAULT_SLIDER_CONFIG: SliderConfig = {
  min: 0,
  max: 10,
  step: 1,
  minLabel: '0',
  maxLabel: '10',
  showValue: true,
}

export const DemographicsEditor = ({
  settings: initialSettings,
  onUpdate,
}: DemographicsEditorProps) => {
  const [settings, setSettings] = useState<DemographicsSettings>(() => ({
    ...DEFAULT_DEMOGRAPHICS_SETTINGS,
    ...(initialSettings ?? {}),
    fields: initialSettings?.fields?.length
      ? initialSettings.fields
      : DEFAULT_DEMOGRAPHICS_SETTINGS.fields,
    caucasianEthnicities: initialSettings?.caucasianEthnicities?.length
      ? initialSettings.caucasianEthnicities
      : DEFAULT_DEMOGRAPHICS_SETTINGS.caucasianEthnicities,
  }))

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    fields: true,
    classification: false,
  })

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const initialLoadRef = useRef(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      initialLoadRef.current = false
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (initialLoadRef.current) return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('saving')
      onUpdate(settings)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }, 1000)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [settings, onUpdate])

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const updateField = (index: number, updates: Partial<DemographicField>) => {
    setSettings((prev) => ({
      ...prev,
      fields: prev.fields.map((f, i) => (i === index ? { ...f, ...updates } : f)),
    }))
  }

  const updateFieldType = (index: number, newType: DemographicField['type']) => {
    setSettings((prev) => ({
      ...prev,
      fields: prev.fields.map((f, i) => {
        if (i !== index) return f

        const baseField = { ...f, type: newType }

        // Initialize type-specific properties
        if (newType === 'single_choice' || newType === 'single_choice_other') {
          return {
            ...baseField,
            options: f.options ?? ['Option 1', 'Option 2'],
            otherOptionValue: newType === 'single_choice_other' ? 'Anders' : undefined,
          }
        }
        if (newType === 'slider') {
          return {
            ...baseField,
            sliderConfig: f.sliderConfig ?? DEFAULT_SLIDER_CONFIG,
          }
        }
        return baseField
      }),
    }))
  }

  const updateSliderConfig = (fieldIndex: number, updates: Partial<SliderConfig>) => {
    setSettings((prev) => ({
      ...prev,
      fields: prev.fields.map((f, i) =>
        i === fieldIndex
          ? {
              ...f,
              sliderConfig: { ...(f.sliderConfig ?? DEFAULT_SLIDER_CONFIG), ...updates },
            }
          : f
      ),
    }))
  }

  const addField = () => {
    const newId = `field_${Date.now()}`
    setSettings((prev) => ({
      ...prev,
      fields: [
        ...prev.fields,
        {
          id: newId,
          label: 'New Question',
          type: 'single_choice',
          options: ['Option 1', 'Option 2'],
          required: true,
        },
      ],
    }))
  }

  const removeField = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }))
  }

  const addFieldOption = (fieldIndex: number) => {
    setSettings((prev) => ({
      ...prev,
      fields: prev.fields.map((f, i) =>
        i === fieldIndex ? { ...f, options: [...(f.options ?? []), 'New option'] } : f
      ),
    }))
  }

  const updateFieldOption = (fieldIndex: number, optionIndex: number, value: string) => {
    setSettings((prev) => ({
      ...prev,
      fields: prev.fields.map((f, i) =>
        i === fieldIndex
          ? {
              ...f,
              options: f.options?.map((o, oi) => (oi === optionIndex ? value : o)),
            }
          : f
      ),
    }))
  }

  const removeFieldOption = (fieldIndex: number, optionIndex: number) => {
    setSettings((prev) => ({
      ...prev,
      fields: prev.fields.map((f, i) =>
        i === fieldIndex
          ? {
              ...f,
              options: f.options?.filter((_, oi) => oi !== optionIndex),
            }
          : f
      ),
    }))
  }

  const addCaucasianEthnicity = () => {
    setSettings((prev) => ({
      ...prev,
      caucasianEthnicities: [...prev.caucasianEthnicities, ''],
    }))
  }

  const updateCaucasianEthnicity = (index: number, value: string) => {
    setSettings((prev) => ({
      ...prev,
      caucasianEthnicities: prev.caucasianEthnicities.map((e, i) =>
        i === index ? value : e
      ),
    }))
  }

  const removeCaucasianEthnicity = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      caucasianEthnicities: prev.caucasianEthnicities.filter((_, i) => i !== index),
    }))
  }

  const renderSaveStatus = () => {
    if (saveStatus === 'saving') {
      return (
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <Loader2 className="w-3 h-3 animate-spin" />
          Saving...
        </span>
      )
    }
    if (saveStatus === 'saved') {
      return (
        <span className="flex items-center gap-1 text-xs text-green-600">
          <Check className="w-3 h-3" />
          Saved
        </span>
      )
    }
    return null
  }

  const renderFieldOptions = (field: DemographicField, fieldIndex: number) => {
    if (field.type !== 'single_choice' && field.type !== 'single_choice_other') {
      return null
    }

    return (
      <div className="space-y-1">
        <label className="text-xs text-gray-500">Options:</label>
        {field.options?.map((option, optionIndex) => (
          <div key={optionIndex} className="flex items-center gap-1">
            <Input
              value={option}
              onChange={(e) =>
                updateFieldOption(fieldIndex, optionIndex, e.target.value)
              }
              className="flex-1 text-sm"
              icon={undefined}
            />
            <button
              type="button"
              onClick={() => removeFieldOption(fieldIndex, optionIndex)}
              className="p-1 hover:bg-gray-200 rounded text-gray-400"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addFieldOption(fieldIndex)}
          className="text-xs text-chili-coral hover:underline flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add option
        </button>

        {field.type === 'single_choice_other' && (
          <div className="mt-2">
            <label className="text-xs text-gray-500">&quot;Other&quot; trigger value:</label>
            <Input
              value={field.otherOptionValue ?? 'Anders'}
              onChange={(e) => updateField(fieldIndex, { otherOptionValue: e.target.value })}
              placeholder="e.g., Anders"
              className="text-sm mt-1"
              icon={undefined}
            />
          </div>
        )}
      </div>
    )
  }

  const renderSliderConfig = (field: DemographicField, fieldIndex: number) => {
    if (field.type !== 'slider') return null

    const config = field.sliderConfig ?? DEFAULT_SLIDER_CONFIG

    return (
      <div className="space-y-2">
        <label className="text-xs text-gray-500">Slider Configuration:</label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs text-gray-400">Min</label>
            <Input
              type="number"
              value={config.min}
              onChange={(e) => updateSliderConfig(fieldIndex, { min: Number(e.target.value) })}
              className="text-sm"
              icon={undefined}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400">Max</label>
            <Input
              type="number"
              value={config.max}
              onChange={(e) => updateSliderConfig(fieldIndex, { max: Number(e.target.value) })}
              className="text-sm"
              icon={undefined}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400">Step</label>
            <Input
              type="number"
              value={config.step}
              onChange={(e) => updateSliderConfig(fieldIndex, { step: Number(e.target.value) })}
              className="text-sm"
              icon={undefined}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-400">Min Label</label>
            <Input
              value={config.minLabel ?? ''}
              onChange={(e) => updateSliderConfig(fieldIndex, { minLabel: e.target.value })}
              placeholder="e.g., Links"
              className="text-sm"
              icon={undefined}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400">Max Label</label>
            <Input
              value={config.maxLabel ?? ''}
              onChange={(e) => updateSliderConfig(fieldIndex, { maxLabel: e.target.value })}
              placeholder="e.g., Rechts"
              className="text-sm"
              icon={undefined}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={config.showValue ?? true}
            onChange={(e) => updateSliderConfig(fieldIndex, { showValue: e.target.checked })}
            className="w-3 h-3"
          />
          Show current value
        </label>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-obsidian">Demographics Settings</h3>
        {renderSaveStatus()}
      </div>

      <div className="border-t border-gray-100 pt-2">
        <SectionHeader
          title={`Questions (${settings.fields.length})`}
          section="fields"
          expanded={expandedSections.fields}
          onToggle={toggleSection}
        />
        {expandedSections.fields && (
          <div className="space-y-4 mt-2">
            {settings.fields.map((field, fieldIndex) => (
              <div key={field.id} className="p-3 bg-gray-50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    {field.id}
                  </span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(fieldIndex, { required: e.target.checked })}
                        className="w-3 h-3"
                      />
                      Required
                    </label>
                    <button
                      type="button"
                      onClick={() => removeField(fieldIndex)}
                      className="p-1 hover:bg-red-100 rounded text-red-400 hover:text-red-600"
                      title="Remove field"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <Input
                  value={field.label}
                  onChange={(e) => updateField(fieldIndex, { label: e.target.value })}
                  placeholder="Question label"
                  className="text-sm"
                  icon={undefined}
                />

                <div>
                  <label className="text-xs text-gray-500">Type:</label>
                  <select
                    value={field.type}
                    onChange={(e) => updateFieldType(fieldIndex, e.target.value as DemographicField['type'])}
                    className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-chili-coral"
                  >
                    {FIELD_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {renderFieldOptions(field, fieldIndex)}
                {renderSliderConfig(field, fieldIndex)}

                {field.type === 'text' && (
                  <div>
                    <label className="text-xs text-gray-500">Placeholder:</label>
                    <Input
                      value={field.placeholder ?? ''}
                      onChange={(e) => updateField(fieldIndex, { placeholder: e.target.value })}
                      placeholder="Placeholder text"
                      className="text-sm mt-1"
                      icon={undefined}
                    />
                  </div>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addField}
              className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-chili-coral hover:text-chili-coral transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Question
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 pt-2">
        <SectionHeader
          title="Demographic Classification"
          section="classification"
          expanded={expandedSections.classification}
          onToggle={toggleSection}
        />
        {expandedSections.classification && (
          <div className="space-y-3 mt-2">
            <p className="text-xs text-gray-500">
              Ethnicities classified as &quot;Caucasian/Dutch&quot; for quota purposes. All
              other ethnicities are classified as &quot;Minority&quot;.
            </p>
            <div className="space-y-2">
              {settings.caucasianEthnicities.map((ethnicity, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={ethnicity}
                    onChange={(e) => updateCaucasianEthnicity(index, e.target.value)}
                    placeholder="Ethnicity name"
                    className="flex-1"
                    icon={undefined}
                  />
                  <button
                    type="button"
                    onClick={() => removeCaucasianEthnicity(index)}
                    className="p-1 hover:bg-gray-100 rounded text-gray-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addCaucasianEthnicity}
                className="text-xs text-chili-coral hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add ethnicity
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
