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
  heroDisplay: { size: 66, lh: 1.10, ls: -2,    family: fontFamily.semibold },
  displayLg:   { size: 50, lh: 1.10, ls: -1.5,  family: fontFamily.semibold },
  headingLg:   { size: 38, lh: 1.20, ls: -1,    family: fontFamily.semibold },
  headingMd:   { size: 30, lh: 1.25, ls: -0.5,  family: fontFamily.semibold },
  headingSm:   { size: 24, lh: 1.30, ls: -0.3,  family: fontFamily.semibold },
  cardTitle:   { size: 19, lh: 1.40, ls: -0.2,  family: fontFamily.semibold },
  subtitle:    { size: 17, lh: 1.50, ls: 0,     family: fontFamily.medium },
  bodyMd:      { size: 16, lh: 1.50, ls: 0,     family: fontFamily.regular },
  bodyMdBold:  { size: 16, lh: 1.50, ls: 0,     family: fontFamily.bold },
  bodySm:      { size: 14, lh: 1.50, ls: 0,     family: fontFamily.regular },
  bodySmMed:   { size: 14, lh: 1.50, ls: 0,     family: fontFamily.medium },
  caption:     { size: 15, lh: 1.50, ls: 0,     family: fontFamily.regular },
  captionBold: { size: 15, lh: 1.40, ls: 0.3,   family: fontFamily.semibold },
  micro:       { size: 14, lh: 1.50, ls: 0.4,   family: fontFamily.regular },
  microBold:   { size: 14, lh: 1.40, ls: 1.5,   family: fontFamily.semibold }, // eyebrow caps
  buttonMd:    { size: 15, lh: 1.40, ls: 0,     family: fontFamily.semibold },
};

// ─────────────────────────────── Category Colors ─────────────────────────
import type { MainCategoryId } from './lib/budget';

// v13 — readable accent colors that work as icon tints on slate backgrounds,
// while staying in the same warm family as CATEGORY_SOLID / CATEGORY_GRADIENT.
export const CATEGORY_BRAND: Record<MainCategoryId, { bg: string; on: string }> = {
  income:    { bg: palette.successText,  on: palette.on }, // emerald — unchanged
  savings:   { bg: '#D85277',            on: palette.on }, // rose (was electric blue)
  necessary: { bg: '#7B66E0',            on: palette.on }, // lavender (was bright purple)
  fixed:     { bg: '#64748B',            on: palette.on }, // slate
  rosca:     { bg: '#C99423',            on: palette.on }, // gold (was sky blue)
  living:    { bg: '#E0814A',            on: palette.on }, // deeper peach
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

// ─────────────────────── v7 pastel-glass design system ──────────────────
//
// Two-stop pastel gradients per category — used by the new SoftCard /
// AllocationTile / Necessary Fund hero. Paired with a 22% white blur overlay
// (handled in components) to produce the frosted-glass look.

// v13 — warm pastel family (Savings is now blush rose, ROSCA is butter cream)
export const CATEGORY_GRADIENT: Record<MainCategoryId, readonly [string, string]> = {
  income:    ['#D7F5DF', '#C9E0FF'], // mint  → sky
  savings:   ['#F6DDE4', '#F2C8D6'], // blush rose
  necessary: ['#E2D5FF', '#FBD8E8'], // lilac → blush
  fixed:     ['#D9F0E2', '#CDEBF5'], // mint  → mint-blue
  rosca:     ['#FBEBC6', '#F5D88E'], // butter cream
  living:    ['#FCE0D0', '#FFE9C9'], // peach → cream
};

// v13 bento solid tiles — saturated pastels with dark ink on top
export const CATEGORY_SOLID: Record<MainCategoryId, string> = {
  income:    '#A3F0CC', // mint
  savings:   '#F4B5C5', // blush rose
  necessary: '#BFAEFE', // lavender
  living:    '#FCB389', // peach
  rosca:     '#F5D88E', // butter cream
  fixed:     '#94A3B8', // slate (unused on tiles)
};

/** v13 chart palette — warm family. */
export const CHART_PALETTE = {
  savings:   '#F4B5C5', // blush rose
  living:    '#FCB389', // peach
  fixed:     '#E8C8F0', // light pink-purple
  necessary: '#BFAEFE', // lavender
  rosca:     '#F5D88E', // butter cream
} satisfies Record<MainCategoryId, string> | Record<string, string>;

// v13 tile ink — dark text colors used on the colored bento backgrounds
export const v7TileInk = {
  primary:   '#0E1220',
  secondary: 'rgba(14,18,32,0.55)',
  tertiary:  'rgba(14,18,32,0.38)',
};

/** v7 layered text colors — softer than pure ink. */
export const v7Text = {
  primary:   '#0E1220',
  secondary: 'rgba(14,18,32,0.62)',
  tertiary:  'rgba(14,18,32,0.38)',
  inverse:   '#FFFFFF',
};

/** v7 surface helpers. */
export const v7Surface = {
  bg:        '#FFFFFF',
  plainCard: '#F7F7FB',   // flat card background
  pillBg:    '#F4F5FA',   // muted pill / filter bg
  hairline:  'rgba(20,30,60,0.07)',
  blurWash:  'rgba(255,255,255,0.22)', // overlay on pastel gradients
  /** Soft ambient blob colors for PageBackground. */
  ambient1:  '#C9E0FF', // top-right
  ambient2:  '#FCE0D0', // bottom-left
};

/** v7 accent colors. */
export const v7Accent = {
  success:    '#3FA67A',
  successSoft:'#DEF1E6',
  danger:     '#E66A4A',
  dangerSoft: '#FCE5DC',
  fund:       '#7B66E0',  // v13 lavender (matches necessary accent)
  fundSoft:   '#EFEBFE',  // soft lavender
};
