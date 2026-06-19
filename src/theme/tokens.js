/**
 * Design tokens — single source of truth for the entire app.
 * Every screen imports from here instead of defining inline palettes.
 *
 * Palette philosophy: one strong accent (royal blue), restrained
 * use of colour, generous whitespace, clear hierarchy.
 */

export const Colors = {
  // Primary accent
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#EFF6FF',
  primaryMuted: '#BFDBFE',

  // Backgrounds
  background: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceElevated: '#FAFAFA',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',

  // Semantic
  success: '#10B981',
  successLight: '#ECFDF5',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',

  // UI
  border: '#E2E8F0',
  disabled: '#CBD5E1',
  disabledText: '#94A3B8',
  overlay: 'rgba(15, 23, 42, 0.5)',
  cardShadow: 'rgba(15, 23, 42, 0.08)',

  // Tournaments (Coming Soon) — deliberately muted
  comingSoon: '#E2E8F0',
  comingSoonText: '#94A3B8',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Typography = {
  h1: 28,
  h2: 22,
  h3: 18,
  h4: 16,
  body: 15,
  bodySmall: 13,
  caption: 12,
  label: 11,
};

export const FontWeight = {
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
  extraBold: '800',
};

export const Shadow = {
  sm: {
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  md: {
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  lg: {
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
};
