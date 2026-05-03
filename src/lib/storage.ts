import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import type { RoscaConfig, Transaction, FixedItem } from './budget';
import { DEFAULT_ROSCA, DEFAULT_BUDGET, DEFAULT_FIXED } from './budget';

const KEY = {
  month:  (y: number, m: number) => `bb:month:${y}-${String(m + 1).padStart(2, '0')}`,
  rosca:  (y: number, m: number) => `bb:rosca:${y}-${String(m + 1).padStart(2, '0')}`,
  budget: (y: number, m: number) => `bb:budget:${y}-${String(m + 1).padStart(2, '0')}`,
  fixed:  (y: number, m: number) => `bb:fixed:${y}-${String(m + 1).padStart(2, '0')}`,
  theme:  'bb:theme',
};

const PREFIX = {
  rosca:  'bb:rosca:',
  budget: 'bb:budget:',
  fixed:  'bb:fixed:',
};

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
    setTransactions(next);
    set(key, next);
    emit(key);
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
