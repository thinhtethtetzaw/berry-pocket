// Module-level current currency. Components/hooks update this via
// setFmtCurrency(); fmt() will use it unless an explicit `currency` is passed.
let _currentCurrency = '฿';

export function setFmtCurrency(c: string) {
  _currentCurrency = c;
}

export function getFmtCurrency() {
  return _currentCurrency;
}

export function fmt(n: number, opts?: { compact?: boolean; currency?: string }): string {
  const symbol = opts?.currency ?? _currentCurrency;
  if (opts?.compact && Math.abs(n) >= 1000) {
    const v = n / 1000;
    return symbol + (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + 'k';
  }
  return symbol + Math.round(n).toLocaleString('en-US');
}

export function fmtNumber(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
