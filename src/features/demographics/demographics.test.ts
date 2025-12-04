import { describe, it, expect } from 'vitest'

import {
  classifyDemographic,
  validateDemographics,
  DEFAULT_DEMOGRAPHICS_SETTINGS,
} from './demographics'

describe('classifyDemographic', () => {
  it('classifies Dutch ethnicity as caucasian', () => {
    expect(classifyDemographic('Nederlands')).toBe('caucasian')
  })

  it('classifies German ethnicity as caucasian', () => {
    expect(classifyDemographic('Duits')).toBe('caucasian')
  })

  it('classifies Polish ethnicity as caucasian', () => {
    expect(classifyDemographic('Pools')).toBe('caucasian')
  })

  it('classifies Surinamese ethnicity as minority', () => {
    expect(classifyDemographic('Surinaams')).toBe('minority')
  })

  it('classifies Turkish ethnicity as minority', () => {
    expect(classifyDemographic('Turks')).toBe('minority')
  })

  it('is case-insensitive', () => {
    expect(classifyDemographic('NEDERLANDS')).toBe('caucasian')
    expect(classifyDemographic('nederlands')).toBe('caucasian')
  })

  it('uses custom caucasian ethnicities when provided', () => {
    const customEthnicities = ['Custom1', 'Custom2']
    expect(classifyDemographic('Custom1', customEthnicities)).toBe('caucasian')
    expect(classifyDemographic('Nederlands', customEthnicities)).toBe('minority')
  })
})

describe('validateDemographics', () => {
  it('returns valid when all required fields are answered', () => {
    const answers = {
      gender: 'Man',
      ethnicity: 'Nederlands',
      ageRange: '25-34',
    }
    const result = validateDemographics(answers, DEFAULT_DEMOGRAPHICS_SETTINGS)
    expect(result.valid).toBe(true)
    expect(result.missingFields).toEqual([])
  })

  it('returns invalid when required field is missing', () => {
    const answers = {
      gender: 'Man',
      ageRange: '25-34',
    }
    const result = validateDemographics(answers, DEFAULT_DEMOGRAPHICS_SETTINGS)
    expect(result.valid).toBe(false)
    expect(result.missingFields).toContain('ethnicity')
  })

  it('returns all missing required fields', () => {
    const answers = {}
    const result = validateDemographics(answers, DEFAULT_DEMOGRAPHICS_SETTINGS)
    expect(result.valid).toBe(false)
    expect(result.missingFields).toEqual(['gender', 'ethnicity', 'ageRange'])
  })

  it('handles empty string as missing', () => {
    const answers = {
      gender: '',
      ethnicity: 'Nederlands',
      ageRange: '25-34',
    }
    const result = validateDemographics(answers, DEFAULT_DEMOGRAPHICS_SETTINGS)
    expect(result.valid).toBe(false)
    expect(result.missingFields).toContain('gender')
  })

  it('handles undefined values', () => {
    const answers = {
      gender: undefined,
      ethnicity: 'Nederlands',
      ageRange: '25-34',
    }
    const result = validateDemographics(answers, DEFAULT_DEMOGRAPHICS_SETTINGS)
    expect(result.valid).toBe(false)
    expect(result.missingFields).toContain('gender')
  })
})

describe('DEFAULT_DEMOGRAPHICS_SETTINGS', () => {
  it('has required fields', () => {
    expect(DEFAULT_DEMOGRAPHICS_SETTINGS.fields).toBeDefined()
    expect(DEFAULT_DEMOGRAPHICS_SETTINGS.fields.length).toBeGreaterThan(0)
  })

  it('has caucasianEthnicities defined', () => {
    expect(DEFAULT_DEMOGRAPHICS_SETTINGS.caucasianEthnicities).toBeDefined()
    expect(DEFAULT_DEMOGRAPHICS_SETTINGS.caucasianEthnicities.length).toBeGreaterThan(0)
  })

  it('has gender field as required', () => {
    const genderField = DEFAULT_DEMOGRAPHICS_SETTINGS.fields.find((f) => f.id === 'gender')
    expect(genderField).toBeDefined()
    expect(genderField?.required).toBe(true)
  })
})
