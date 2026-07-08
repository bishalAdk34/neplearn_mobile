// Central design tokens for NepLearn. Use these instead of hardcoded hex.

export const colors = {
  primary: '#800816',
  background: '#FBF9F4',
  ink: '#4A1942',
  accent: '#6366F1',
  border: '#E5D5D0',
  surface: '#FFFFFF',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  success: '#10B981',
  successDark: '#065F46',
  warning: '#F59E0B',
  danger: '#DC2626',
  disabled: '#D1D5DB',
  mutedSurface: '#F3F4F6',
  warmSurface: '#FEF3C7',
  warmInk: '#92400E',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

export const typography = {
  title: { fontSize: 24, fontWeight: '700' as const },
  heading: { fontSize: 20, fontWeight: '700' as const },
  subheading: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 14, fontWeight: '400' as const },
  small: { fontSize: 12, fontWeight: '400' as const },
} as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;

export const theme = { colors, spacing, radii, typography, shadows };
export default theme;
