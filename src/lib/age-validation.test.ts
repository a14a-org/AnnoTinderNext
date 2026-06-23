import { describe, it, expect } from 'vitest'

import { isUnder18, calculateAgeFromMonthYear, meetsAgeRequirement } from './age-validation'

const currentYear = new Date().getFullYear()

describe('isUnder18', () => {
  it('screens out a real minor (complete date ~15 years ago)', () => {
    expect(isUnder18(`06-${currentYear - 15}`)).toBe(true)
  })

  it('admits a valid adult', () => {
    expect(isUnder18('06-1990')).toBe(false)
  })

  // Regression: the bug this fix addresses — a half-filled birthdate must NOT
  // be treated as under-18 (it previously computed age 0 → wrongly screened out).
  it('does NOT screen out a month-only partial date', () => {
    expect(isUnder18('06-')).toBe(false)
  })

  it('does NOT screen out a year-only partial date', () => {
    expect(isUnder18('-1990')).toBe(false)
  })

  it('does NOT screen out an empty value', () => {
    expect(isUnder18('')).toBe(false)
  })

  // A COMPLETE date that genuinely computes to a child age is still screened —
  // the fix only spares unparseable/partial input, not real young ages.
  it('still screens a complete date that computes to a young age', () => {
    expect(isUnder18(`06-${currentYear}`)).toBe(true)
  })
})

describe('calculateAgeFromMonthYear (unchanged)', () => {
  it('returns 0 for incomplete input', () => {
    expect(calculateAgeFromMonthYear('06-')).toBe(0)
    expect(calculateAgeFromMonthYear('-1990')).toBe(0)
  })

  it('computes a plausible age for a complete date', () => {
    expect(calculateAgeFromMonthYear('06-2000')).toBeGreaterThan(20)
    expect(calculateAgeFromMonthYear('06-2000')).toBeLessThan(40)
  })
})

describe('meetsAgeRequirement', () => {
  it('passes a clear adult and fails a clear minor', () => {
    expect(meetsAgeRequirement('06-1990')).toBe(true)
    expect(meetsAgeRequirement(`06-${currentYear - 10}`)).toBe(false)
  })
})
