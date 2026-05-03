import { CATEGORY_BRAND } from '../theme';
import type { MainCategoryId } from '../lib/budget';

/** Returns the brand color for a category (mode-agnostic — MiniMax brand colors stay saturated). */
export function categoryAccent(main: MainCategoryId, _mode: 'light' | 'dark'): string {
  return CATEGORY_BRAND[main].bg;
}
