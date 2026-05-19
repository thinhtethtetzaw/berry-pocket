import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import type { RoscaConfig, Transaction, FixedItem } from './budget';
import { DEFAULT_ROSCA, DEFAULT_BUDGET, DEFAULT_FIXED } from './budget';
import { setFmtCurrency } from './format';

const KEY = {
  month:  (y: number, m: number) => `bb:month:${y}-${String(m + 1).padStart(2, '0')}`,
  rosca:  (y: number, m: number) => `bb:rosca:${y}-${String(m + 1).padStart(2, '0')}`,
  budget: (y: number, m: number) => `bb:budget:${y}-${String(m + 1).padStart(2, '0')}`,
  fixed:  (y: number, m: number) => `bb:fixed:${y}-${String(m + 1).padStart(2, '0')}`,
  theme:  'bb:theme',
  // v1.1 — global, not per-month
  total:           'bb:total',           // single number, editable, ever-running
  necessaryFund:   'bb:necessaryFund',   // single number, editable, subset of total
  withdrawals:     'bb:withdrawals',     // log of necessary-fund usages
  lastSeenMonth:   'bb:lastSeenMonth',   // YYYY-MM string for rollover modal
  totalsMigrated:  'bb:totalsMigrated',  // boolean flag
  // v1.1 — preferences
  currency:        'bb:currency',
  themePref:       'bb:themePref',
  language:        'bb:language',
  // v1.2 — user-defined categories layered on top of built-ins
  customMains:     'bb:customMains',
  customSubs:      'bb:customSubs',
  // v1.2 — list of cycle keys whose payout has been received
  roscaReceipts:   'bb:roscaReceipts',
  // v1.2 — flag for one-time injection of the "For my parents" fixed entry
  parentsMigrated: 'bb:parentsMigrated',
};

const PREFIX = {
  rosca:  'bb:rosca:',
  budget: 'bb:budget:',
  fixed:  'bb:fixed:',
};

// v1.1 — channel names for the Total / NecessaryFund streams
const CH = {
  total:        'ch:total',
  necessary:    'ch:necessary',
  withdrawals:  'ch:withdrawals',
  currency:     'ch:currency',
  themePref:    'ch:themePref',
  language:     'ch:language',
  customMains:  'ch:customMains',
  customSubs:   'ch:customSubs',
  roscaReceipts:'ch:roscaReceipts',
};

// Fired whenever any month transaction list is written, so the
// Statistics screen's "all transactions" aggregator can refresh.
const CH_ALL_MONTHS = 'ch:any-month';

// ─────────────────────── Types for v1.1 features ────────────────────────

export interface NecessaryWithdrawal {
  id: number;
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD
}

// ─────────────────────────────── Generic ────────────────────────────────

async function get<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch { return fallback; }
}

async function set<T>(key: string, value: T): Promise<void> {
  try { await AsyncStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ──────────────────── Cross-screen sync (pub-sub) ───────────────────────
// AsyncStorage doesn't notify React when a key is written, so a write from
// HomeScreen's hook instance can't be observed by TransactionsScreen's
// hook instance. We bridge that with a simple in-memory event emitter
// keyed by either the exact storage key (for transactions) or a prefix
// (for the per-month settings, where any month edit should refresh the
// other screens reading the carry-forward value).

const listeners: Record<string, Set<() => void>> = {};

function subscribe(channel: string, cb: () => void): () => void {
  if (!listeners[channel]) listeners[channel] = new Set();
  listeners[channel].add(cb);
  return () => { listeners[channel]?.delete(cb); };
}

function emit(channel: string) {
  listeners[channel]?.forEach(cb => cb());
}

/**
 * Load month-scoped settings with "carry-forward" semantics:
 * - exact `prefix + YYYY-MM` match wins;
 * - else the most recent saved month *before* the target;
 * - else the provided fallback.
 *
 * Editing a month writes only that month's key, so changes never
 * back-propagate to past months.
 */
async function getForMonth<T>(
  prefix: string,
  year: number,
  month: number,
  fallback: T,
): Promise<T> {
  const yyyymm = `${year}-${String(month + 1).padStart(2, '0')}`;
  const exactKey = prefix + yyyymm;

  try {
    const exact = await AsyncStorage.getItem(exactKey);
    if (exact) return JSON.parse(exact) as T;

    const allKeys = await AsyncStorage.getAllKeys();
    const candidates = allKeys
      .filter(k => k.startsWith(prefix))
      .filter(k => k.slice(prefix.length) <= yyyymm) // string compare on YYYY-MM
      .sort();

    if (candidates.length > 0) {
      const newest = candidates[candidates.length - 1];
      const raw = await AsyncStorage.getItem(newest);
      if (raw) return JSON.parse(raw) as T;
    }
  } catch {}
  return fallback;
}

// ─────────── v1.1 · Total Amount + Necessary Fund side effects ─────────
//
// Rules:
// - "savings" transactions roll into Total only.
// - "necessary" transactions roll into BOTH Total and NecessaryFund.
// - Necessary-fund withdrawals (a separate log, not normal transactions)
//   subtract from Total and NecessaryFund.
// - Total and NecessaryFund are also user-editable directly.
// - On every transaction save we compute a diff vs. the previous list
//   and apply it, so create/update/delete all stay in sync.

function sumByMain(list: Transaction[], main: Transaction['main']): number {
  return list.reduce((s, t) => (t.main === main ? s + t.amount : s), 0);
}

async function applyTransactionDiff(prev: Transaction[], next: Transaction[]) {
  const savingsDiff   = sumByMain(next, 'savings')   - sumByMain(prev, 'savings');
  const necessaryDiff = sumByMain(next, 'necessary') - sumByMain(prev, 'necessary');

  if (savingsDiff === 0 && necessaryDiff === 0) return;

  const total    = await get<number>(KEY.total, 0);
  const fund     = await get<number>(KEY.necessaryFund, 0);
  const newTotal = total + savingsDiff + necessaryDiff;
  const newFund  = fund + necessaryDiff;

  await Promise.all([
    set(KEY.total,         newTotal),
    set(KEY.necessaryFund, newFund),
  ]);
  emit(CH.total);
  emit(CH.necessary);
}

// ─────────── Migration · retroactive Total from existing history ────────

let migrationPromise: Promise<void> | null = null;

export function ensureTotalsMigrated(): Promise<void> {
  if (migrationPromise) return migrationPromise;
  migrationPromise = (async () => {
    try {
      const done = await get<boolean>(KEY.totalsMigrated, false);
      if (done) return;

      const allKeys = await AsyncStorage.getAllKeys();
      const monthKeys = allKeys.filter(k => k.startsWith('bb:month:'));

      let totalSavings = 0;
      let totalNecessary = 0;
      for (const k of monthKeys) {
        const txs = await get<Transaction[]>(k, []);
        for (const t of txs) {
          if (t.main === 'savings')   totalSavings   += t.amount;
          if (t.main === 'necessary') totalNecessary += t.amount;
        }
      }

      // No need to subtract withdrawals — there are none on the first run.
      await Promise.all([
        set(KEY.total,          totalSavings + totalNecessary),
        set(KEY.necessaryFund,  totalNecessary),
        set(KEY.totalsMigrated, true),
      ]);
      emit(CH.total);
      emit(CH.necessary);
    } catch {}
  })();
  return migrationPromise;
}

// ─────────── v1.2 · "For my parents" fixed-expense back-fill ───────────
//
// "For my parents" (฿2,000) was added to DEFAULT_FIXED later, but existing
// saved months (before this default existed) don't have it. This one-time
// migration iterates every saved `bb:fixed:*` key and appends the entry
// when missing.

let parentsMigrationPromise: Promise<void> | null = null;
export function ensureParentsMigrated(): Promise<void> {
  if (parentsMigrationPromise) return parentsMigrationPromise;
  parentsMigrationPromise = (async () => {
    try {
      const done = await get<boolean>(KEY.parentsMigrated, false);
      if (done) return;

      const keys = await AsyncStorage.getAllKeys();
      const fixedKeys = keys.filter(k => k.startsWith('bb:fixed:'));
      let updatedAny = false;
      for (const k of fixedKeys) {
        const items = await get<FixedItem[]>(k, []);
        const hasParents = items.some(
          (i) => i.id === 'family' || i.label.toLowerCase().includes('parent'),
        );
        if (!hasParents) {
          // Insert before ROSCA if present, else append.
          const roscaIdx = items.findIndex((i) => i.id === 'rosca');
          const next = [...items];
          const parentsEntry: FixedItem = {
            id: 'family',
            label: 'For my parents',
            icon: 'Heart',
            amount: 2000,
          };
          if (roscaIdx >= 0) next.splice(roscaIdx, 0, parentsEntry);
          else next.push(parentsEntry);
          await set(k, next);
          updatedAny = true;
        }
      }

      await set(KEY.parentsMigrated, true);
      if (updatedAny) emit(PREFIX.fixed);
    } catch {}
  })();
  return parentsMigrationPromise;
}

// ─────────────────────────────── Hooks ──────────────────────────────────

export function useMonthData(year: number, month: number) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const key = KEY.month(year, month);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const refetch = () => {
      get<Transaction[]>(key, []).then(d => {
        if (alive) { setTransactions(d); setLoading(false); }
      });
    };
    refetch();
    const unsub = subscribe(key, refetch);
    return () => { alive = false; unsub(); };
  }, [year, month]);

  const save = (next: Transaction[]) => {
    const prev = transactions;
    setTransactions(next);
    set(key, next);
    emit(key);
    emit(CH_ALL_MONTHS);
    // Side-effect: roll savings/necessary deltas into Total + NecessaryFund.
    applyTransactionDiff(prev, next);
  };

  const add = (tx: Omit<Transaction, 'id'>) =>
    save([...transactions, { ...tx, id: Date.now() }]);

  const update = (id: number, patch: Omit<Transaction, 'id'>) =>
    save(transactions.map(t => (t.id === id ? { ...patch, id } : t)));

  const remove = (id: number) =>
    save(transactions.filter(t => t.id !== id));

  return { transactions, add, update, remove, loading };
}

export function useRosca(year: number, month: number) {
  const [cfg, setCfg] = useState<RoscaConfig>(DEFAULT_ROSCA);

  useEffect(() => {
    let alive = true;
    const refetch = () => {
      getForMonth<RoscaConfig>(PREFIX.rosca, year, month, DEFAULT_ROSCA)
        .then(v => { if (alive) setCfg(v); });
    };
    refetch();
    const unsub = subscribe(PREFIX.rosca, refetch);
    return () => { alive = false; unsub(); };
  }, [year, month]);

  const update = (next: RoscaConfig) => {
    setCfg(next);
    set(KEY.rosca(year, month), next);
    emit(PREFIX.rosca);
  };
  return { cfg, update };
}

export function useBudget(year: number, month: number) {
  const [budget, setBudget] = useState(DEFAULT_BUDGET);

  useEffect(() => {
    let alive = true;
    const refetch = () => {
      getForMonth(PREFIX.budget, year, month, DEFAULT_BUDGET)
        .then(v => { if (alive) setBudget(v); });
    };
    refetch();
    const unsub = subscribe(PREFIX.budget, refetch);
    return () => { alive = false; unsub(); };
  }, [year, month]);

  const update = (next: typeof DEFAULT_BUDGET) => {
    setBudget(next);
    set(KEY.budget(year, month), next);
    emit(PREFIX.budget);
  };
  return { budget, update };
}

export function useFixed(year: number, month: number) {
  const [fixed, setFixed] = useState<FixedItem[]>(DEFAULT_FIXED);

  useEffect(() => {
    let alive = true;
    const refetch = () => {
      getForMonth<FixedItem[]>(PREFIX.fixed, year, month, DEFAULT_FIXED)
        .then(v => { if (alive) setFixed(v); });
    };
    // Run the one-time "For my parents" back-fill before the first read,
    // so previously-saved months pick up the new default entry.
    ensureParentsMigrated().then(refetch);
    const unsub = subscribe(PREFIX.fixed, refetch);
    return () => { alive = false; unsub(); };
  }, [year, month]);

  const update = (next: FixedItem[]) => {
    setFixed(next);
    set(KEY.fixed(year, month), next);
    emit(PREFIX.fixed);
  };
  return { fixed, update };
}

export function useStoredTheme() {
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    get<'light' | 'dark'>(KEY.theme, 'light').then(setThemeState);
  }, []);

  const setTheme = (t: 'light' | 'dark') => { setThemeState(t); set(KEY.theme, t); };
  return [theme, setTheme] as const;
}

// ─────────── v1.1 · Total Amount hook ───────────

export function useTotal() {
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    let alive = true;
    const refetch = () => {
      get<number>(KEY.total, 0).then(v => { if (alive) setTotal(v); });
    };
    ensureTotalsMigrated().then(refetch);
    const unsub = subscribe(CH.total, refetch);
    return () => { alive = false; unsub(); };
  }, []);

  /** Direct edit by user — overwrite stored value. */
  const setManual = (next: number) => {
    setTotal(next);
    set(KEY.total, next);
    emit(CH.total);
  };

  return { total, setManual };
}

// ─────────── v1.1 · Necessary Fund hook ───────────

export function useNecessaryFund() {
  const [fund, setFund] = useState<number>(0);

  useEffect(() => {
    let alive = true;
    const refetch = () => {
      get<number>(KEY.necessaryFund, 0).then(v => { if (alive) setFund(v); });
    };
    ensureTotalsMigrated().then(refetch);
    const unsub = subscribe(CH.necessary, refetch);
    return () => { alive = false; unsub(); };
  }, []);

  const setManual = (next: number) => {
    setFund(next);
    set(KEY.necessaryFund, next);
    emit(CH.necessary);
  };

  return { fund, setManual };
}

// ─────────── v1.1 · Necessary-fund withdrawals (the "use fund" log) ─────

export function useNecessaryWithdrawals() {
  const [list, setList] = useState<NecessaryWithdrawal[]>([]);

  useEffect(() => {
    let alive = true;
    const refetch = () => {
      get<NecessaryWithdrawal[]>(KEY.withdrawals, [])
        .then(v => { if (alive) setList(v); });
    };
    refetch();
    const unsub = subscribe(CH.withdrawals, refetch);
    return () => { alive = false; unsub(); };
  }, []);

  const add = async (w: Omit<NecessaryWithdrawal, 'id'>) => {
    const next = [...list, { ...w, id: Date.now() }];
    setList(next);
    await set(KEY.withdrawals, next);
    emit(CH.withdrawals);

    // Side-effect: subtract from Total + NecessaryFund.
    const total = await get<number>(KEY.total, 0);
    const fund  = await get<number>(KEY.necessaryFund, 0);
    await Promise.all([
      set(KEY.total,         total - w.amount),
      set(KEY.necessaryFund, fund  - w.amount),
    ]);
    emit(CH.total);
    emit(CH.necessary);
  };

  const remove = async (id: number) => {
    const target = list.find(w => w.id === id);
    if (!target) return;
    const next = list.filter(w => w.id !== id);
    setList(next);
    await set(KEY.withdrawals, next);
    emit(CH.withdrawals);

    // Reverse the side-effect.
    const total = await get<number>(KEY.total, 0);
    const fund  = await get<number>(KEY.necessaryFund, 0);
    await Promise.all([
      set(KEY.total,         total + target.amount),
      set(KEY.necessaryFund, fund  + target.amount),
    ]);
    emit(CH.total);
    emit(CH.necessary);
  };

  return { withdrawals: list, add, remove };
}

// ─────────── v1.1 · All-months aggregator (for Statistics) ───────────

/**
 * Loads every saved month bucket from AsyncStorage and concatenates the
 * transactions, attaching `year` + `month` so consumers can filter by range.
 * Re-runs whenever any month bucket emits a change.
 */
export interface DatedTransaction extends Transaction {
  year: number;
  month: number; // 0-indexed to match JS Date
}

export function useAllTransactions() {
  const [list, setList] = useState<DatedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  // Bumped each time any month emits — re-fetches on edit anywhere.
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    (async () => {
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        const monthKeys = allKeys.filter(k => k.startsWith('bb:month:'));
        const out: DatedTransaction[] = [];
        for (const k of monthKeys) {
          // key looks like "bb:month:2026-05"
          const yyyymm = k.slice('bb:month:'.length);
          const [ys, ms] = yyyymm.split('-');
          const year = parseInt(ys, 10);
          const month = parseInt(ms, 10) - 1;
          const txs = await get<Transaction[]>(k, []);
          for (const t of txs) out.push({ ...t, year, month });
        }
        if (alive) { setList(out); setLoading(false); }
      } catch {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [tick]);

  // Listen for any month-bucket write and refetch.
  useEffect(() => {
    const allKeys = ['bb:month:'];
    // We don't know specific keys ahead of time, so subscribe to a global
    // channel instead — emit on every save is added below in useMonthData.
    const unsub = subscribe(CH_ALL_MONTHS, () => setTick(t => t + 1));
    return unsub;
  }, []);

  return { transactions: list, loading };
}

// ─────────── v1.1 · Last-seen month (for rollover modal) ───────────

export function useLastSeenMonth() {
  const [seen, setSeen] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    get<string | null>(KEY.lastSeenMonth, null).then(v => {
      if (alive) { setSeen(v); setLoaded(true); }
    });
    return () => { alive = false; };
  }, []);

  const mark = (yyyymm: string) => {
    setSeen(yyyymm);
    set(KEY.lastSeenMonth, yyyymm);
  };

  return { lastSeen: seen, mark, loaded };
}

// ─────────── v1.1 · Preferences (Currency / Theme / Language) ───────────

const CURRENCY_DEFAULT = '฿';
const THEME_DEFAULT = 'light' as const;
const LANGUAGE_DEFAULT = 'en' as const;

export type ThemePref = 'light' | 'dark' | 'system';
export type LangPref = 'en' | 'th' | 'zh' | 'es';

/**
 * Currency symbol used throughout the app via fmt().
 * On first mount this hook also pushes the value into format.ts so
 * existing fmt() calls automatically respect the preference.
 */
export function useCurrency() {
  const [currency, setCurrencyState] = useState<string>(CURRENCY_DEFAULT);

  useEffect(() => {
    let alive = true;
    const refetch = () => {
      get<string>(KEY.currency, CURRENCY_DEFAULT).then(v => {
        if (alive) {
          setCurrencyState(v);
          setFmtCurrency(v);
        }
      });
    };
    refetch();
    const unsub = subscribe(CH.currency, refetch);
    return () => { alive = false; unsub(); };
  }, []);

  const setCurrency = async (next: string) => {
    setCurrencyState(next);
    setFmtCurrency(next);
    await set(KEY.currency, next);
    emit(CH.currency);
  };

  return { currency, setCurrency };
}

export function useThemePref() {
  const [pref, setPref] = useState<ThemePref>(THEME_DEFAULT);

  useEffect(() => {
    let alive = true;
    const refetch = () => {
      get<ThemePref>(KEY.themePref, THEME_DEFAULT).then(v => {
        if (alive) setPref(v);
      });
    };
    refetch();
    const unsub = subscribe(CH.themePref, refetch);
    return () => { alive = false; unsub(); };
  }, []);

  const setThemePref = async (next: ThemePref) => {
    setPref(next);
    await set(KEY.themePref, next);
    emit(CH.themePref);
  };

  return { themePref: pref, setThemePref };
}

export function useLanguage() {
  const [lang, setLang] = useState<LangPref>(LANGUAGE_DEFAULT);

  useEffect(() => {
    let alive = true;
    const refetch = () => {
      get<LangPref>(KEY.language, LANGUAGE_DEFAULT).then(v => {
        if (alive) setLang(v);
      });
    };
    refetch();
    const unsub = subscribe(CH.language, refetch);
    return () => { alive = false; unsub(); };
  }, []);

  const setLanguage = async (next: LangPref) => {
    setLang(next);
    await set(KEY.language, next);
    emit(CH.language);
  };

  return { language: lang, setLanguage };
}

// ─────────── v1.2 · Custom Categories (user-defined) ───────────
//
// Built-in MAIN_CATEGORIES and SUB_CATEGORIES from budget.ts stay
// hard-coded. The user adds *additional* categories on top via these
// hooks. Consumers should read from `useAllMainCategories()` /
// `useAllSubCategories()` to get the merged list.

import type { MainCategory, MainCategoryId, SubCategory } from './budget';
import { MAIN_CATEGORIES, SUB_CATEGORIES } from './budget';

export interface CustomMain extends MainCategory {
  /** Hex color used in pickers / pastel tints. */
  color: string;
  /** Optional override for the pastel tint background. */
  pastel?: string;
}

export function useCustomMains() {
  const [list, setList] = useState<CustomMain[]>([]);

  useEffect(() => {
    let alive = true;
    const refetch = () => {
      get<CustomMain[]>(KEY.customMains, []).then(v => { if (alive) setList(v); });
    };
    refetch();
    const unsub = subscribe(CH.customMains, refetch);
    return () => { alive = false; unsub(); };
  }, []);

  const save = async (next: CustomMain[]) => {
    setList(next);
    await set(KEY.customMains, next);
    emit(CH.customMains);
  };

  const upsert = (cat: CustomMain) => {
    const exists = list.some(c => c.id === cat.id);
    const next = exists ? list.map(c => (c.id === cat.id ? cat : c)) : [...list, cat];
    return save(next);
  };

  const remove = (id: string) => save(list.filter(c => c.id !== id));

  return { customMains: list, upsert, remove };
}

export function useCustomSubs() {
  const [list, setList] = useState<SubCategory[]>([]);

  useEffect(() => {
    let alive = true;
    const refetch = () => {
      get<SubCategory[]>(KEY.customSubs, []).then(v => { if (alive) setList(v); });
    };
    refetch();
    const unsub = subscribe(CH.customSubs, refetch);
    return () => { alive = false; unsub(); };
  }, []);

  const save = async (next: SubCategory[]) => {
    setList(next);
    await set(KEY.customSubs, next);
    emit(CH.customSubs);
  };

  const upsert = (sub: SubCategory) => {
    const exists = list.some(s => s.id === sub.id);
    const next = exists ? list.map(s => (s.id === sub.id ? sub : s)) : [...list, sub];
    return save(next);
  };

  const remove = (id: string) => save(list.filter(s => s.id !== id));

  return { customSubs: list, upsert, remove };
}

/**
 * Merged list of built-in + user-defined main categories. Read-only —
 * consumers that just need to display/select categories should use this.
 */
export function useAllMainCategories(): MainCategory[] {
  const { customMains } = useCustomMains();
  return useMemo(() => [...MAIN_CATEGORIES, ...customMains], [customMains]);
}

export function useAllSubCategories(): SubCategory[] {
  const { customSubs } = useCustomSubs();
  return useMemo(() => [...SUB_CATEGORIES, ...customSubs], [customSubs]);
}

// ─────────── v1.2 · ROSCA payout receipts ───────────
//
// Identifies a unique cycle by (startYear, startMonth, myPosition). Once
// the user taps "Mark payout as received" that cycle's key is added to
// the receipts list and the payout amount is bumped into Total Amount.
// Re-configuring the circle (different start or position) gives a new
// cycle key, so the button comes back for the next round.

export function cycleKeyFor(cfg: RoscaConfig): string {
  return `${cfg.startYear}-${String(cfg.startMonth + 1).padStart(2, '0')}-pos${cfg.myPosition}`;
}

export function useRoscaReceipts() {
  const [list, setList] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    const refetch = () => {
      get<string[]>(KEY.roscaReceipts, []).then(v => { if (alive) setList(v); });
    };
    refetch();
    const unsub = subscribe(CH.roscaReceipts, refetch);
    return () => { alive = false; unsub(); };
  }, []);

  /**
   * Mark a cycle's payout as received. Also bumps the running Total Amount
   * by the payout (`monthlyPayment * groupSize`) and emits all relevant
   * channels so other screens refresh.
   */
  const markReceived = async (cfg: RoscaConfig) => {
    const key = cycleKeyFor(cfg);
    if (list.includes(key)) return; // already received

    const payout = cfg.monthlyPayment * cfg.groupSize;
    const next = [...list, key];
    setList(next);
    await set(KEY.roscaReceipts, next);
    emit(CH.roscaReceipts);

    // Bump Total Amount in-place.
    const t = await get<number>(KEY.total, 0);
    await set(KEY.total, t + payout);
    emit(CH.total);
  };

  /** Undo a receipt — refunds the payout back out of Total Amount. */
  const undoReceived = async (cfg: RoscaConfig) => {
    const key = cycleKeyFor(cfg);
    if (!list.includes(key)) return;

    const payout = cfg.monthlyPayment * cfg.groupSize;
    const next = list.filter(k => k !== key);
    setList(next);
    await set(KEY.roscaReceipts, next);
    emit(CH.roscaReceipts);

    const t = await get<number>(KEY.total, 0);
    await set(KEY.total, t - payout);
    emit(CH.total);
  };

  return { receipts: list, markReceived, undoReceived };
}

export function isCycleReceived(receipts: string[], cfg: RoscaConfig): boolean {
  return receipts.includes(cycleKeyFor(cfg));
}

// ─────────── v1.2 · Import / Export (JSON backup) ───────────
//
// Bundles every `bb:*` key into a single JSON file the user can save off
// the device. Importing wipes existing data and restores from the file.

const EXPORT_VERSION = 1;

export interface ExportBundle {
  version: number;
  exportedAt: string;
  appVersion: string;
  data: Record<string, unknown>;
}

/**
 * Gather every namespaced key into a single bundle and return as a JSON
 * string ready for saving / sharing.
 */
/**
 * Reset configuration only — wipes settings/preferences (budget targets,
 * fixed items, ROSCA cfg, currency, theme, custom categories) but KEEPS
 * activity data: transactions, total, necessary fund, withdrawals,
 * ROSCA receipts. Use this when the user wants a fresh start to the
 * setup but keeps their history.
 */
export async function resetConfigOnly(): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys();
  // Keys to wipe — configuration only
  const configPrefixes = ['bb:budget:', 'bb:fixed:', 'bb:rosca:'];
  const configExact = new Set<string>([
    KEY.currency,
    KEY.themePref,
    KEY.language,
    KEY.customMains,
    KEY.customSubs,
    KEY.parentsMigrated, // re-run the parents migration after reset
  ]);
  const toRemove = allKeys.filter(
    (k) =>
      configExact.has(k) ||
      configPrefixes.some((p) => k.startsWith(p)),
  );
  if (toRemove.length > 0) await AsyncStorage.multiRemove(toRemove);

  // Reset fmt() symbol immediately
  setFmtCurrency('฿');

  // Notify every relevant channel so screens refetch
  emit(CH.currency);
  emit(CH.themePref);
  emit(CH.language);
  emit(CH.customMains);
  emit(CH.customSubs);
  emit(PREFIX.budget);
  emit(PREFIX.fixed);
  emit(PREFIX.rosca);
}

/**
 * Clear ALL data — including transactions, totals, and receipts.
 * Resets the app to its very first-launch state.
 */
export async function clearAllData(): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys();
  const bbKeys = allKeys.filter((k) => k.startsWith('bb:'));
  if (bbKeys.length > 0) await AsyncStorage.multiRemove(bbKeys);

  setFmtCurrency('฿');

  // Fan out every channel so every hook refetches from a clean slate.
  for (const ch of Object.values(CH)) emit(ch);
  for (const ch of Object.values(PREFIX)) emit(ch);
  emit(CH_ALL_MONTHS);
}

export async function exportAllData(): Promise<string> {
  const keys = await AsyncStorage.getAllKeys();
  const bbKeys = keys.filter(k => k.startsWith('bb:'));
  const data: Record<string, unknown> = {};
  for (const k of bbKeys) {
    const raw = await AsyncStorage.getItem(k);
    if (raw == null) continue;
    try {
      data[k] = JSON.parse(raw);
    } catch {
      data[k] = raw; // fallback for non-JSON values
    }
  }
  const bundle: ExportBundle = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: '1.1',
    data,
  };
  return JSON.stringify(bundle, null, 2);
}

/**
 * Parse + validate a previously-exported JSON string. Throws if the
 * structure is wrong so the caller can show a clear error.
 */
export function parseImportBundle(raw: string): ExportBundle {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('File is not valid JSON.');
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('File does not look like a BerryPocket export.');
  }
  const b = parsed as Partial<ExportBundle>;
  if (typeof b.version !== 'number' || !b.data || typeof b.data !== 'object') {
    throw new Error('Missing required fields (version, data).');
  }
  if (b.version > EXPORT_VERSION) {
    throw new Error('This export was made by a newer version of the app.');
  }
  return b as ExportBundle;
}

/**
 * Restore data from a parsed bundle. Wipes every existing `bb:*` key
 * first, then writes the bundle's keys, then notifies every hook so
 * UI refreshes immediately.
 */
export async function importAllData(bundle: ExportBundle): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys();
  const bbKeys = allKeys.filter(k => k.startsWith('bb:'));
  if (bbKeys.length > 0) await AsyncStorage.multiRemove(bbKeys);

  const entries: [string, string][] = [];
  for (const [k, v] of Object.entries(bundle.data)) {
    if (!k.startsWith('bb:')) continue; // safety
    entries.push([k, JSON.stringify(v)]);
  }
  if (entries.length > 0) await AsyncStorage.multiSet(entries);

  // Reload the format-currency cache so fmt() picks up the imported value.
  try {
    const c = await get<string>(KEY.currency, '฿');
    setFmtCurrency(c);
  } catch {}

  // Fire every channel so all hooks refetch from AsyncStorage.
  //
  // Different hooks subscribe to different channel names — we must hit
  // all of them or some screens won't refresh after import.
  //   useTotal/useNecessaryFund/useNecessaryWithdrawals/useCurrency/
  //   useThemePref/useLanguage/useCustomMains/useCustomSubs → CH.*
  //   useRosca/useBudget/useFixed                           → PREFIX.*
  //   useMonthData                                          → exact key per month
  //   useAllTransactions                                    → CH_ALL_MONTHS
  for (const ch of Object.values(CH)) emit(ch);
  for (const ch of Object.values(PREFIX)) emit(ch);
  emit(CH_ALL_MONTHS);

  // Emit on every imported month-transactions key so each useMonthData
  // hook instance (one per visible screen) refetches its own bucket.
  for (const k of Object.keys(bundle.data)) {
    if (k.startsWith('bb:month:')) emit(k);
  }
}
