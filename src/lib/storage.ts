import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
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
    refetch();
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
