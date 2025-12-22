/**
 * Centralized Theme Configuration
 *
 * This file serves as the single source of truth for theme values.
 * When updating colors here, also update the corresponding CSS variables
 * in src/app/globals.css to keep them in sync.
 *
 * The CSS variables are used by Tailwind CSS v4's @theme directive,
 * while this TypeScript config can be used for runtime color access.
 */

/**
 * Default brand color used throughout the application.
 * Change this single value to update the default brand color everywhere.
 */
export const DEFAULT_BRAND_COLOR = '#FFD500';

export const colors = {
  /**
   * Brand Colors - "Omroep Zwart" Palette
   * The primary brand color used for buttons, links, and interactive elements
   */
  brand: {
    /** Primary brand yellow - used for buttons, active states, focus rings */
    primary: '#FFD500',
    /** Lighter variant - used for hover states */
    primaryHover: '#FFE033',
    /** Darker variant - used for active/pressed states */
    primaryActive: '#E6C000',
    /** Black - used for text on yellow, backgrounds */
    black: '#000000',
  },

  /**
   * Secondary Colors - "Bio Teal" Palette
   */
  secondary: {
    teal: '#38B2AC',
    soft: '#E6FFFA',
  },

  /**
   * Text Colors - "Obsidian" Palette
   */
  text: {
    primary: '#1A202C',
    muted: '#4A5568',
    light: '#718096',
  },

  /**
   * Background Colors - "Canvas" Palette
   */
  background: {
    default: '#F7F9FC',
    white: '#FFFFFF',
  },
} as const;

/**
 * CSS variable names mapping
 * Use these when you need to reference CSS variables in JavaScript
 */
export const cssVars = {
  brand: {
    primary: '--color-oz-yellow',
    primaryHover: '--color-oz-yellow-light',
    primaryActive: '--color-oz-yellow-dark',
    black: '--color-oz-black',
  },
  secondary: {
    teal: '--color-bio-teal',
    soft: '--color-bio-soft',
  },
  text: {
    primary: '--color-obsidian',
    muted: '--color-obsidian-muted',
    light: '--color-obsidian-light',
  },
  background: {
    default: '--color-canvas',
    white: '--color-canvas-white',
  },
} as const;

/**
 * Tailwind class names mapping
 * Use these when constructing Tailwind classes programmatically
 */
export const tailwindColors = {
  brand: {
    primary: 'oz-yellow',
    primaryHover: 'oz-yellow-light',
    primaryActive: 'oz-yellow-dark',
    black: 'oz-black',
  },
  secondary: {
    teal: 'bio-teal',
    soft: 'bio-soft',
  },
  text: {
    primary: 'obsidian',
    muted: 'obsidian-muted',
    light: 'obsidian-light',
  },
  background: {
    default: 'canvas',
    white: 'canvas-white',
  },
} as const;

export type ThemeColors = typeof colors;
export type CssVars = typeof cssVars;
export type TailwindColors = typeof tailwindColors;
