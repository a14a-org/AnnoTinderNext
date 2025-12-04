import { describe, it, expect } from 'vitest'

import {
  isDefined,
  isNonEmptyString,
  isNonEmptyArray,
  isValidQuestionType,
  isValidSessionStatus,
  hasProperty,
  isRecord,
} from './type-guards'

describe('isDefined', () => {
  it('returns true for defined values', () => {
    expect(isDefined('hello')).toBe(true)
    expect(isDefined(0)).toBe(true)
    expect(isDefined(false)).toBe(true)
    expect(isDefined({})).toBe(true)
    expect(isDefined([])).toBe(true)
  })

  it('returns false for null', () => {
    expect(isDefined(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isDefined(undefined)).toBe(false)
  })
})

describe('isNonEmptyString', () => {
  it('returns true for non-empty strings', () => {
    expect(isNonEmptyString('hello')).toBe(true)
    expect(isNonEmptyString('a')).toBe(true)
    expect(isNonEmptyString(' ')).toBe(true)
  })

  it('returns false for empty string', () => {
    expect(isNonEmptyString('')).toBe(false)
  })

  it('returns false for non-strings', () => {
    expect(isNonEmptyString(null)).toBe(false)
    expect(isNonEmptyString(undefined)).toBe(false)
    expect(isNonEmptyString(123)).toBe(false)
    expect(isNonEmptyString({})).toBe(false)
  })
})

describe('isNonEmptyArray', () => {
  it('returns true for non-empty arrays', () => {
    expect(isNonEmptyArray([1])).toBe(true)
    expect(isNonEmptyArray([1, 2, 3])).toBe(true)
    expect(isNonEmptyArray(['a'])).toBe(true)
  })

  it('returns false for empty arrays', () => {
    expect(isNonEmptyArray([])).toBe(false)
  })

  it('returns false for null', () => {
    expect(isNonEmptyArray(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isNonEmptyArray(undefined)).toBe(false)
  })
})

describe('isValidQuestionType', () => {
  it('returns true for valid question types', () => {
    expect(isValidQuestionType('WELCOME_SCREEN')).toBe(true)
    expect(isValidQuestionType('MULTIPLE_CHOICE')).toBe(true)
    expect(isValidQuestionType('DEMOGRAPHICS')).toBe(true)
    expect(isValidQuestionType('TEXT_ANNOTATION')).toBe(true)
  })

  it('returns false for invalid question types', () => {
    expect(isValidQuestionType('INVALID')).toBe(false)
    expect(isValidQuestionType('')).toBe(false)
    expect(isValidQuestionType(null)).toBe(false)
    expect(isValidQuestionType(undefined)).toBe(false)
  })
})

describe('isValidSessionStatus', () => {
  it('returns true for valid session statuses', () => {
    expect(isValidSessionStatus('started')).toBe(true)
    expect(isValidSessionStatus('completed')).toBe(true)
    expect(isValidSessionStatus('screened_out')).toBe(true)
  })

  it('returns false for invalid session statuses', () => {
    expect(isValidSessionStatus('invalid')).toBe(false)
    expect(isValidSessionStatus('')).toBe(false)
    expect(isValidSessionStatus(null)).toBe(false)
  })
})

describe('hasProperty', () => {
  it('returns true when object has property', () => {
    expect(hasProperty({ name: 'test' }, 'name')).toBe(true)
    expect(hasProperty({ a: 1, b: 2 }, 'a')).toBe(true)
  })

  it('returns false when object lacks property', () => {
    expect(hasProperty({ name: 'test' }, 'age')).toBe(false)
    expect(hasProperty({}, 'any')).toBe(false)
  })

  it('returns false for non-objects', () => {
    expect(hasProperty(null, 'key')).toBe(false)
    expect(hasProperty(undefined, 'key')).toBe(false)
    expect(hasProperty('string', 'key')).toBe(false)
  })
})

describe('isRecord', () => {
  it('returns true for plain objects', () => {
    expect(isRecord({})).toBe(true)
    expect(isRecord({ key: 'value' })).toBe(true)
  })

  it('returns false for arrays', () => {
    expect(isRecord([])).toBe(false)
    expect(isRecord([1, 2, 3])).toBe(false)
  })

  it('returns false for null', () => {
    expect(isRecord(null)).toBe(false)
  })

  it('returns false for primitives', () => {
    expect(isRecord('string')).toBe(false)
    expect(isRecord(123)).toBe(false)
    expect(isRecord(true)).toBe(false)
  })
})
