import { describe, it, expect } from 'vitest'

import {
  parseCSVToTexts,
  splitIntoSentences,
  splitIntoWords,
} from './text-annotation'

describe('parseCSVToTexts', () => {
  it('parses CSV with text column', () => {
    const csv = `text,category
Hello world,greeting
Goodbye world,farewell`
    const result = parseCSVToTexts(csv)
    expect(result).toHaveLength(2)
    expect(result[0].text).toBe('Hello world')
    expect(result[0].metadata).toEqual({ category: 'greeting' })
    expect(result[1].text).toBe('Goodbye world')
    expect(result[1].metadata).toEqual({ category: 'farewell' })
  })

  it('parses CSV with tekst column (Dutch)', () => {
    const csv = `tekst,categorie
Hallo wereld,begroeting`
    const result = parseCSVToTexts(csv)
    expect(result).toHaveLength(1)
    expect(result[0].text).toBe('Hallo wereld')
  })

  it('uses first column if no text column found', () => {
    const csv = `content,other
Hello,123`
    const result = parseCSVToTexts(csv)
    expect(result).toHaveLength(1)
    expect(result[0].text).toBe('Hello')
  })

  it('handles quoted values with commas', () => {
    const csv = `text,note
"Hello, world",greeting`
    const result = parseCSVToTexts(csv)
    expect(result).toHaveLength(1)
    expect(result[0].text).toBe('Hello, world')
  })

  it('handles empty CSV', () => {
    const csv = ''
    const result = parseCSVToTexts(csv)
    expect(result).toHaveLength(0)
  })

  it('handles CSV with only headers', () => {
    const csv = 'text,category'
    const result = parseCSVToTexts(csv)
    expect(result).toHaveLength(0)
  })

  it('handles semicolon delimiter', () => {
    const csv = `text;category
Hello;greeting`
    const result = parseCSVToTexts(csv)
    expect(result).toHaveLength(1)
    expect(result[0].text).toBe('Hello')
  })
})

describe('splitIntoSentences', () => {
  it('splits text by sentence-ending punctuation', () => {
    const text = 'Hello world. How are you? I am fine!'
    const result = splitIntoSentences(text)
    expect(result).toEqual(['Hello world.', 'How are you?', 'I am fine!'])
  })

  it('handles single sentence', () => {
    const text = 'Hello world.'
    const result = splitIntoSentences(text)
    expect(result).toEqual(['Hello world.'])
  })

  it('handles text without punctuation', () => {
    const text = 'Hello world'
    const result = splitIntoSentences(text)
    expect(result).toEqual(['Hello world'])
  })

  it('filters out empty strings', () => {
    const text = 'Hello.   World.'
    const result = splitIntoSentences(text)
    expect(result).toEqual(['Hello.', 'World.'])
  })

  it('handles empty string', () => {
    const text = ''
    const result = splitIntoSentences(text)
    expect(result).toEqual([])
  })
})

describe('splitIntoWords', () => {
  it('splits text by whitespace', () => {
    const text = 'Hello world'
    const result = splitIntoWords(text)
    expect(result).toEqual(['Hello', 'world'])
  })

  it('handles multiple spaces', () => {
    const text = 'Hello   world'
    const result = splitIntoWords(text)
    expect(result).toEqual(['Hello', 'world'])
  })

  it('handles tabs and newlines', () => {
    const text = 'Hello\tworld\ntest'
    const result = splitIntoWords(text)
    expect(result).toEqual(['Hello', 'world', 'test'])
  })

  it('filters out empty strings', () => {
    const text = '  Hello  '
    const result = splitIntoWords(text)
    expect(result).toEqual(['Hello'])
  })

  it('handles empty string', () => {
    const text = ''
    const result = splitIntoWords(text)
    expect(result).toEqual([])
  })
})
