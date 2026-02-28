/**
 * Design system tokens for the Open Agents mobile app.
 * Clean, modern dark theme inspired by developer tools.
 */

export const colors = {
  // Core palette
  primary: '#6366F1', // Indigo
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',

  // Semantic colors
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Background layers (dark theme)
  background: '#0A0E1A',
  surface: '#111827',
  surfaceElevated: '#1F2937',
  surfaceHighlight: '#374151',

  // Text
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textInverse: '#111827',

  // Borders
  border: '#374151',
  borderSubtle: '#1F2937',

  // Team colors
  teamCreative: '#A78BFA',
  teamManager: '#F59E0B',
  teamCodeWriter: '#34D399',

  // Status colors
  statusActive: '#22C55E',
  statusIdle: '#F59E0B',
  statusPending: '#3B82F6',
  statusSuspended: '#EF4444',
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
