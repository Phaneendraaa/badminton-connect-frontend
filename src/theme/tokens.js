/**
 * Design tokens — single source of truth for the entire app.
 * Establishing a premium Midnight Dark Theme with vibrant gradients,
 * translucent borders, and high contrast typography.
 */

export const Colors = {
  // Primary dark backgrounds
  background: '#090D1A',       // Deep midnight navy
  surface: '#121829',          // Cards and containers
  surfaceElevated: '#1E2640',  // Modals and tooltips
  surfaceGlass: 'rgba(22, 28, 45, 0.7)',

  // Brand / Gradient accents (Colors to be passed as arrays to LinearGradient)
  accentGreen: ['#00F5A0', '#00D9F5'],     // Electric Emerald to Cyan
  accentPurple: ['#8B5CF6', '#EC4899'],    // Violet to Hot Pink
  accentOrange: ['#F59E0B', '#EF4444'],    // Amber to Red
  accentDark: ['#1E293B', '#0F172A'],      // Slate gradient for dark elements

  // Solid Accent fallbacks
  primary: '#00F5A0',          // Electric Emerald
  primaryDark: '#00D9F5',      // Cyan
  primaryMuted: 'rgba(0, 245, 160, 0.15)',
  primaryLight: 'rgba(0, 245, 160, 0.08)',

  secondary: '#8B5CF6',        // Violet
  secondaryMuted: 'rgba(139, 92, 246, 0.15)',

  // Text
  textPrimary: '#FFFFFF',      // Pure white
  textSecondary: '#94A3B8',    // Light slate
  textTertiary: '#64748B',     // Muted cool gray
  textInverse: '#0F172A',      // Dark text on bright backgrounds

  // Semantic
  success: '#10B981',
  successLight: 'rgba(16, 185, 129, 0.1)',
  danger: '#EF4444',
  dangerLight: 'rgba(239, 68, 68, 0.1)',
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.1)',

  // Borders & Dividers
  border: 'rgba(255, 255, 255, 0.08)',      // Translucent border for glassmorphism
  borderLight: 'rgba(255, 255, 255, 0.04)',
  borderGlow: 'rgba(0, 245, 160, 0.3)',      // Subtle green glow border
  borderGlowPurple: 'rgba(139, 92, 246, 0.3)',

  // Interactive states
  disabled: '#1E293B',
  disabledText: '#475569',
  overlay: 'rgba(5, 8, 16, 0.75)',
  cardShadow: 'rgba(0, 0, 0, 0.5)',

  // Tournaments (Coming Soon) — translucent gray
  comingSoon: '#1E293B',
  comingSoonText: '#475569',
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
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  md: {
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  lg: {
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  glow: {
    elevation: 4,
    shadowColor: '#00F5A0',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  glowPurple: {
    elevation: 4,
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
};
