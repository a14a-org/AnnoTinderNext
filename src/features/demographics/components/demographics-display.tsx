'use client'

import type { DemographicsSettings, DemographicAnswers, DemographicField } from '../demographics'

import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

import { validateDemographics } from '../demographics'
import { letterToIndex } from '@/lib/keyboard-shortcuts'

export interface DemographicsDisplayProps {
  settings: DemographicsSettings
  brandColor: string | undefined
  onComplete: (answers: DemographicAnswers) => void
  disabled: boolean | undefined
}

export const DemographicsDisplay = ({
  settings,
  brandColor = '#EF4444',
  onComplete,
  disabled = false,
}: DemographicsDisplayProps) => {
  const [answers, setAnswers] = useState<DemographicAnswers>({})
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0)
  // For single_choice_other: track if "other" text field is shown
  const [showOtherInput, setShowOtherInput] = useState(false)
  const [otherText, setOtherText] = useState('')

  const currentField = settings.fields[currentFieldIndex]
  const totalFields = settings.fields.length
  const progress = ((currentFieldIndex + 1) / totalFields) * 100

  const goToNextField = useCallback(() => {
    // For slider fields, ensure current value is saved (even if user didn't move it)
    let finalAnswers = answers
    if (currentField?.type === 'slider' && currentField.sliderConfig && !answers[currentField.id]) {
      const { min, max } = currentField.sliderConfig
      const defaultValue = Math.floor((min + max) / 2)
      finalAnswers = { ...answers, [currentField.id]: String(defaultValue) }
      setAnswers(finalAnswers)
    }

    if (currentFieldIndex < totalFields - 1) {
      setCurrentFieldIndex(currentFieldIndex + 1)
      setShowOtherInput(false)
      setOtherText('')
    } else {
      const validation = validateDemographics(finalAnswers, settings)
      if (validation.valid) {
        onComplete(finalAnswers)
      }
    }
  }, [currentFieldIndex, totalFields, answers, settings, onComplete, currentField])

  const handleSelect = useCallback(
    (value: string) => {
      if (disabled) return

      // For single_choice_other, check if "other" was selected
      if (currentField.type === 'single_choice_other' && currentField.otherOptionValue) {
        if (value === currentField.otherOptionValue) {
          setShowOtherInput(true)
          return // Don't proceed yet, wait for text input
        }
      }

      const newAnswers = {
        ...answers,
        [currentField.id]: value,
      }
      setAnswers(newAnswers)

      setTimeout(() => {
        if (currentFieldIndex < totalFields - 1) {
          setCurrentFieldIndex(currentFieldIndex + 1)
          setShowOtherInput(false)
          setOtherText('')
        } else {
          const validation = validateDemographics(newAnswers, settings)
          if (validation.valid) {
            onComplete(newAnswers)
          }
        }
      }, 300)
    },
    [answers, currentField, currentFieldIndex, totalFields, settings, onComplete, disabled]
  )

  const handleOtherTextSubmit = useCallback(() => {
    if (disabled || !otherText.trim()) return

    const newAnswers = {
      ...answers,
      [currentField.id]: `${currentField.otherOptionValue}: ${otherText.trim()}`,
    }
    setAnswers(newAnswers)

    setTimeout(() => {
      goToNextField()
    }, 300)
  }, [answers, currentField, otherText, disabled, goToNextField])

  const handleBack = useCallback(() => {
    if (disabled) return
    if (showOtherInput) {
      setShowOtherInput(false)
      setOtherText('')
      return
    }
    if (currentFieldIndex > 0) {
      setCurrentFieldIndex(currentFieldIndex - 1)
      setShowOtherInput(false)
      setOtherText('')
    }
  }, [currentFieldIndex, disabled, showOtherInput])

  const currentAnswer = answers[currentField?.id]
  const isLastField = currentFieldIndex === totalFields - 1

  // Check if current field needs a "Next" button
  const needsNextButton = useCallback(() => {
    if (!currentField) return false
    if (currentField.type === 'text' && currentAnswer) return true
    if (currentField.type === 'slider') return true
    if (currentField.type === 'month_year' && currentAnswer) return true
    if (showOtherInput && otherText.trim()) return true
    return false
  }, [currentField, currentAnswer, showOtherInput, otherText])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return

      // Handle input fields
      if (e.target instanceof HTMLInputElement) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          if (showOtherInput && otherText.trim()) {
            handleOtherTextSubmit()
          } else if (needsNextButton()) {
            goToNextField()
          }
        }
        return
      }

      // Handle single choice keyboard shortcuts
      if ((currentField?.type === 'single_choice' || currentField?.type === 'single_choice_other') && currentField.options && !showOtherInput) {
        const index = letterToIndex(e.key)
        if (index !== null && index < currentField.options.length) {
          e.preventDefault()
          handleSelect(currentField.options[index])
        }
      }

      if (e.key === 'Escape' && (currentFieldIndex > 0 || showOtherInput)) {
        e.preventDefault()
        handleBack()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    currentField,
    currentFieldIndex,
    currentAnswer,
    isLastField,
    answers,
    settings,
    handleSelect,
    handleBack,
    onComplete,
    disabled,
    showOtherInput,
    otherText,
    handleOtherTextSubmit,
    goToNextField,
    needsNextButton,
  ])

  if (!currentField) {
    return null
  }

  if (disabled) {
    return (
      <div className="w-full max-w-xl mx-auto">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-4" />
          <p className="text-gray-500">Processing your answers...</p>
        </div>
      </div>
    )
  }

  const renderSingleChoiceOptions = (field: DemographicField) => {
    if ((field.type !== 'single_choice' && field.type !== 'single_choice_other') || !field.options) {
      return null
    }

    if (showOtherInput) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 text-center">
            {field.otherOptionValue} - gelieve te specificeren:
          </p>
          <input
            type="text"
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            placeholder="Type your answer..."
            className="w-full text-xl border-0 border-b-2 border-gray-300 focus:border-current focus:ring-0 bg-transparent py-2 outline-none transition-colors"
            style={{ borderColor: otherText ? brandColor : undefined }}
            autoFocus
          />
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {field.options.map((option, index) => (
          <button
            key={option}
            onClick={() => handleSelect(option)}
            className={`w-full p-4 text-left rounded-xl border-2 transition-all flex items-center gap-3 ${
              currentAnswer === option
                ? 'border-current bg-opacity-10'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            style={{
              borderColor: currentAnswer === option ? brandColor : undefined,
              backgroundColor: currentAnswer === option ? `${brandColor}15` : undefined,
            }}
          >
            <span
              className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium"
              style={{
                borderColor: currentAnswer === option ? brandColor : '#D1D5DB',
                backgroundColor: currentAnswer === option ? brandColor : undefined,
                color: currentAnswer === option ? 'white' : '#6B7280',
              }}
            >
              {String.fromCharCode(65 + index)}
            </span>
            <span className="text-obsidian">{option}</span>
          </button>
        ))}
      </div>
    )
  }

  const renderTextInput = () => {
    if (currentField.type !== 'text') {
      return null
    }

    return (
      <input
        type="text"
        value={currentAnswer ?? ''}
        onChange={(e) =>
          setAnswers((prev) => ({
            ...prev,
            [currentField.id]: e.target.value,
          }))
        }
        placeholder={currentField.placeholder ?? 'Type your answer...'}
        className="w-full text-xl border-0 border-b-2 border-gray-300 focus:border-current focus:ring-0 bg-transparent py-2 outline-none transition-colors"
        style={{ borderColor: currentAnswer ? brandColor : undefined }}
        autoFocus
      />
    )
  }

  const renderSlider = () => {
    if (currentField.type !== 'slider' || !currentField.sliderConfig) {
      return null
    }

    const { min, max, step, minLabel, maxLabel, showValue = true } = currentField.sliderConfig
    const value = currentAnswer !== undefined ? Number(currentAnswer) : Math.floor((min + max) / 2)

    return (
      <div className="space-y-6">
        {showValue && (
          <div className="text-center">
            <span
              className="text-5xl font-bold"
              style={{ color: brandColor }}
            >
              {value}
            </span>
          </div>
        )}
        <div className="px-2">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) =>
              setAnswers((prev) => ({
                ...prev,
                [currentField.id]: e.target.value,
              }))
            }
            className="w-full h-3 rounded-full appearance-none cursor-pointer slider-thumb"
            style={{
              background: `linear-gradient(to right, ${brandColor} 0%, ${brandColor} ${((value - min) / (max - min)) * 100}%, #E5E7EB ${((value - min) / (max - min)) * 100}%, #E5E7EB 100%)`,
            }}
          />
          <div className="flex justify-between mt-2 text-sm text-gray-500">
            <span>{minLabel ?? min}</span>
            <span>{maxLabel ?? max}</span>
          </div>
        </div>
        <style jsx>{`
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: ${brandColor};
            cursor: pointer;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          }
          input[type="range"]::-moz-range-thumb {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: ${brandColor};
            cursor: pointer;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          }
        `}</style>
      </div>
    )
  }

  const renderMonthYear = () => {
    if (currentField.type !== 'month_year') {
      return null
    }

    // Parse existing value or use empty
    const [month, year] = (currentAnswer ?? '-').split('-')

    const handleMonthYearChange = (newMonth: string, newYear: string) => {
      const value = `${newMonth}-${newYear}`
      setAnswers((prev) => ({
        ...prev,
        [currentField.id]: value,
      }))
    }

    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 100 }, (_, i) => currentYear - i)
    const months = [
      { value: '01', label: 'Januari' },
      { value: '02', label: 'Februari' },
      { value: '03', label: 'Maart' },
      { value: '04', label: 'April' },
      { value: '05', label: 'Mei' },
      { value: '06', label: 'Juni' },
      { value: '07', label: 'Juli' },
      { value: '08', label: 'Augustus' },
      { value: '09', label: 'September' },
      { value: '10', label: 'Oktober' },
      { value: '11', label: 'November' },
      { value: '12', label: 'December' },
    ]

    return (
      <div className="flex gap-4 justify-center">
        <select
          value={month || ''}
          onChange={(e) => handleMonthYearChange(e.target.value, year || '')}
          className="px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-current transition-colors"
          style={{ borderColor: month ? brandColor : undefined }}
        >
          <option value="">Maand</option>
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <select
          value={year || ''}
          onChange={(e) => handleMonthYearChange(month || '', e.target.value)}
          className="px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-current transition-colors"
          style={{ borderColor: year ? brandColor : undefined }}
        >
          <option value="">Jaar</option>
          {years.map((y) => (
            <option key={y} value={y.toString()}>
              {y}
            </option>
          ))}
        </select>
      </div>
    )
  }

  const renderKeyboardHint = () => {
    if ((currentField.type === 'single_choice' || currentField.type === 'single_choice_other') && currentField.options && !showOtherInput) {
      return (
        <div className="text-center mt-8 text-sm text-gray-400">
          Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">A</kbd>-
          <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
            {String.fromCharCode(64 + currentField.options.length)}
          </kbd>{' '}
          to select
          {currentFieldIndex > 0 && (
            <>
              {' · '}
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Esc</kbd> to go back
            </>
          )}
        </div>
      )
    }

    if ((currentField.type === 'text' || showOtherInput) && (currentAnswer || otherText)) {
      return (
        <div className="text-center mt-8 text-sm text-gray-400">
          Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Enter</kbd> to continue
          {(currentFieldIndex > 0 || showOtherInput) && (
            <>
              {' · '}
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Esc</kbd> to go back
            </>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>
            Question {currentFieldIndex + 1} of {totalFields}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: brandColor }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {currentFieldIndex === 0 && (
        <div className="text-center mb-8">
          <h2 className="text-2xl font-display font-bold text-obsidian mb-2">
            {settings.title}
          </h2>
          {settings.description && (
            <p className="text-obsidian-muted">{settings.description}</p>
          )}
        </div>
      )}

      <motion.div
        key={`${currentField.id}-${showOtherInput}`}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="text-xl font-medium text-obsidian mb-6 text-center">
          {currentField.label}
          {currentField.required && <span className="text-red-500 ml-1">*</span>}
        </h3>

        {renderSingleChoiceOptions(currentField)}
        {renderTextInput()}
        {renderSlider()}
        {renderMonthYear()}
      </motion.div>

      <div className="flex justify-between items-center mt-8">
        <button
          onClick={handleBack}
          disabled={currentFieldIndex === 0 && !showOtherInput}
          className={`text-sm ${
            currentFieldIndex === 0 && !showOtherInput
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ← Back
        </button>

        {needsNextButton() && (
          <button
            onClick={() => {
              if (showOtherInput && otherText.trim()) {
                handleOtherTextSubmit()
              } else {
                goToNextField()
              }
            }}
            className="px-6 py-2 rounded-lg font-medium text-white transition-all cursor-pointer hover:brightness-110 active:brightness-90"
            style={{ backgroundColor: brandColor }}
          >
            {isLastField ? 'Continue' : 'Next'}
          </button>
        )}
      </div>

      {renderKeyboardHint()}
    </div>
  )
}
