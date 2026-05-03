// ─────────────────────────────────────────────────────────────────────────
// BerryPocket · MiniMax-inspired design system
// Stark monochrome + vibrant brand colors per category
// ─────────────────────────────────────────────────────────────────────────

export const palette = {
  // Surfaces
  canvas:        '#FFFFFF',
  surface:       '#F7F8FA',
  surfaceSoft:   '#F2F3F5',
  hairline:      '#E5E7EB',
  hairlineSoft:  '#EAECF0',

  // Ink
  ink:           '#0A0A0A',
  inkStrong:     '#000000',
  charcoal:      '#222222',
  slate:         '#45515E',
  steel:         '#5F5F5F',
  stone:         '#8E8E93',
  muted:         '#A8AAB2',

  // Brand product colors
  brandCoral:    '#FF5530',
  brandMagenta:  '#EA5EC1',
  brandBlue:     '#1456F0',
  brandBlueDeep: '#1D4ED8',
  brandBlue200:  '#BFDBFE',
  brandBlue700:  '#17437D',
  brandCyan:     '#3DAEFF',
  brandPurple:   '#A855F7',

  // Semantic
  successBg:     '#E8FFEA',
  successText:   '#1BA673',
  errorRed:      '#D45656',

  on:            '#FFFFFF', // text on dark/colored surfaces
  white:         '#FFFFFF',
  black:         '#000000',

  // ── Backward-compat aliases (old palette) ──────────────────────────
  cream50:    '#FBF9F4',
  cream100:   '#F5F1E8',
  midnight900: '#0A0A0A',
  midnight800: '#16162A',
  midnight950: '#08080F',
  indigo300:  '#A5ABFF',
  indigo800:  '#312E81',
  indigo900:  '#1E1B4B',
  sage300:    '#A4C3B2',
  sage500:    '#1BA673',
  sage700:    '#3F6F58',
  gold300:    '#E8D9A8',
  gold400:    '#FF5530', // remap to coral for FAB gradient
  gold500:    '#FF5530',
  gold600:    '#EA5EC1',
  gold700:    '#1456F0',
  mauve300:   '#C4B0D6',
  mauve500:   '#A855F7',
  mauve600:   '#76528B',
  terra500:   '#FF5530',
  terra600:   '#D45656',

  // Dark mode
  darkCanvas:    '#0A0A0A',
  darkSurface:   '#141416',
  darkSurfaceSoft: '#1A1A1D',
  darkHairline:  'rgba(255,255,255,0.10)',
  darkHairlineSoft: 'rgba(255,255,255,0.06)',
  darkInk:       '#FAFAFA',
  darkCharcoal:  '#E5E5E5',
  darkSteel:     '#A8AAB2',
  darkMuted:     '#6B6B70',
};

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  bg: string;            // canvas
  bgElevated: string;    // card surface (same as canvas mostly — flat design)
  bgSubtle: string;      // surface
  bgSoft: string;        // surface-soft
  border: string;        // hairline
  borderSoft: string;    // hairline-soft
  ink: string;           // primary text/CTAs
  charcoal: string;      // body
  steel: string;         // secondary
  stone: string;         // tertiary
  muted: string;         // muted
  primary: string;       // ink (CTA bg)
  onPrimary: string;

  // ── Backward-compat aliases (old "luxury" theme) ─────────────────────
  text: string;          // → ink
  textMuted: string;     // → steel
  textFaint: string;     // → muted
  borderStrong: string;  // → border (same)
  accent: string;        // → ink (MiniMax has no separate accent)
  accentText: string;    // → onPrimary
  shadow: string;
}

export const lightTheme: Theme = {
  mode: 'light',
  bg: palette.canvas,
  bgElevated: palette.canvas,
  bgSubtle: palette.surface,
  bgSoft: palette.surfaceSoft,
  border: palette.hairline,
  borderSoft: palette.hairlineSoft,
  ink: palette.ink,
  charcoal: palette.charcoal,
  steel: palette.steel,
  stone: palette.stone,
  muted: palette.muted,
  primary: palette.ink,
  onPrimary: palette.on,
  // back-compat
  text: palette.ink,
  textMuted: palette.steel,
  textFaint: palette.muted,
  borderStrong: palette.hairline,
  accent: palette.ink,
  accentText: palette.on,
  shadow: 'rgba(0,0,0,0.04)',
};

export const darkTheme: Theme = {
  mode: 'dark',
  bg: palette.darkCanvas,
  bgElevated: palette.darkSurface,
  bgSubtle: palette.darkSurface,
  bgSoft: palette.darkSurfaceSoft,
  border: palette.darkHairline,
  borderSoft: palette.darkHairlineSoft,
  ink: palette.darkInk,
  charcoal: palette.darkCharcoal,
  steel: palette.darkSteel,
  stone: palette.darkMuted,
  muted: palette.darkMuted,
  primary: palette.darkInk,
  onPrimary: palette.darkCanvas,
  // back-compat
  text: palette.darkInk,
  textMuted: palette.darkSteel,
  textFaint: palette.darkMuted,
  borderStrong: palette.darkHairline,
  accent: palette.darkInk,
  accentText: palette.darkCanvas,
  shadow: 'rgba(0,0,0,0.4)',
};

// ─────────────────────────────── Spacing ─────────────────────────────────
export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  sectionSm: 48,
  section: 64,
};

// ─────────────────────────────── Radii ───────────────────────────────────
export const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  xxxl: 24,
  hero: 32,
  full: 9999,
  pill: 9999,   // alias
};

// ─────────────────────────────── Typography ──────────────────────────────
// Font stack: DM Sans loaded via @expo-google-fonts/dm-sans
export const fontFamily = {
  regular:  'DMSans_400Regular',
  medium:   'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  bold:     'DMSans_700Bold',
};

// Weight mapping (each weight = its own loaded font)
export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '700' as const, // alias — DM Sans tops out at 700
};

// ── Backward-compat: old fontSize / fontWeight / extra spacing ─────
export const fontSize = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
};

// merge legacy "xxxl" spacing key into space (already there)
(space as Record<string, number>).xxxl = space.xxxl ?? 40;

// Type scale (MiniMax)
export const type = {
  heroDisplay: { size: 64, lh: 1.10, ls: -2,    family: fontFamily.semibold },
  displayLg:   { size: 48, lh: 1.10, ls: -1.5,  family: fontFamily.semibold },
  headingLg:   { size: 36, lh: 1.20, ls: -1,    family: fontFamily.semibold },
  headingMd:   { size: 28, lh: 1.25, ls: -0.5,  family: fontFamily.semibold },
  headingSm:   { size: 22, lh: 1.30, ls: -0.3,  family: fontFamily.semibold },
  cardTitle:   { size: 18, lh: 1.40, ls: -0.2,  family: fontFamily.semibold },
  subtitle:    { size: 16, lh: 1.50, ls: 0,     family: fontFamily.medium },
  bodyMd:      { size: 15, lh: 1.50, ls: 0,     family: fontFamily.regular },
  bodyMdBold:  { size: 15, lh: 1.50, ls: 0,     family: fontFamily.bold },
  bodySm:      { size: 13, lh: 1.50, ls: 0,     family: fontFamily.regular },
  bodySmMed:   { size: 13, lh: 1.50, ls: 0,     family: fontFamily.medium },
  caption:     { size: 12, lh: 1.50, ls: 0,     family: fontFamily.regular },
  captionBold: { size: 12, lh: 1.40, ls: 0.3,   family: fontFamily.semibold },
  micro:       { size: 11, lh: 1.50, ls: 0.4,   family: fontFamily.regular },
  microBold:   { size: 11, lh: 1.40, ls: 1.5,   family: fontFamily.semibold }, // eyebrow caps
  buttonMd:    { size: 14, lh: 1.40, ls: 0,     family: fontFamily.semibold },
};

// ─────────────────────────────── Category Colors ─────────────────────────
import type { MainCategoryId } from './lib/budget';

export const CATEGORY_BRAND: Record<MainCategoryId, { bg: string; on: string }> = {
  income:    { bg: palette.successText,  on: palette.on }, // emerald
  savings:   { bg: palette.brandBlue,    on: palette.on }, // electric blue
  necessary: { bg: palette.brandPurple,  on: palette.on }, // purple
  fixed:     { bg: palette.ink,          on: palette.on }, // black
  rosca:     { bg: '#3B9EFF',             on: palette.on }, // sky blue
  living:    { bg: palette.brandCoral,   on: palette.on }, // coral
};

/** Soft pastel tints for light-mode quick-action tiles. */
export const CATEGORY_PASTEL: Record<MainCategoryId, string> = {
  income:    '#E0F5EA',  // mint
  savings:   '#E1E5FF',  // lavender blue
  necessary: '#F0E5FF',  // light purple
  fixed:     '#F2F2F4',  // light gray
  rosca:     '#D8EEFF',  // light sky blue
  living:    '#FFE5DC',  // peach
};
