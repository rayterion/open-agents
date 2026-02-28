/**
 * Design system tokens for the Open Agents mobile app.
 * Clean, modern light theme with warm neutrals and teal accent.
 */

export const colors = {
  // Core palette
  primary: '#0D9488', // Teal-600
  primaryLight: '#14B8A6', // Teal-500
  primaryDark: '#0F766E', // Teal-700

  // Semantic colors
  success: '#16A34A', // Green-600
  warning: '#D97706', // Amber-600
  error: '#DC2626', // Red-600
  info: '#2563EB', // Blue-600

  // Background layers (light theme)
  background: '#FAFAF9', // Stone-50
  surface: '#FFFFFF',
  surfaceElevated: '#F5F5F4', // Stone-100
  surfaceHighlight: '#E7E5E4', // Stone-200

  // Text
  textPrimary: '#1C1917', // Stone-900
  textSecondary: '#78716C', // Stone-500
  textMuted: '#A8A29E', // Stone-400
  textInverse: '#FAFAF9',

  // Borders
  border: '#E7E5E4', // Stone-200
  borderSubtle: '#F5F5F4', // Stone-100

  // Team colors
  teamCreative: '#7C3AED', // Violet-600
  teamManager: '#D97706', // Amber-600
  teamCodeWriter: '#059669', // Emerald-600

  // Status colors
  statusActive: '#16A34A',
  statusIdle: '#D97706',
  statusPending: '#2563EB',
  statusSuspended: '#DC2626',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  hero: 36,
} as const;

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export type Colors = typeof colors;
export type Spacing = typeof spacing;
