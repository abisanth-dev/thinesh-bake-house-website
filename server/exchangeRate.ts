import type { GeneralSettings } from '../src/types.js';

// Live store-currency -> LKR rate for Dialog Genie, which charges in rupees only. Fetched from two
// free daily-updated sources (the second is a backup) and cached per server instance. The rate saved
// in Settings is used only when neither source can be reached.

const REFRESH_MS = 60 * 60 * 1000;     // look for a newer rate hourly (both sources update daily)
const STALE_LIMIT_MS = 24 * 60 * 60 * 1000; // keep using the last fetched rate for a day if sources fail
const RETRY_MS = 5 * 60 * 1000;        // after a failed fetch, wait before trying again

type CachedRate = { rate: number; source: string; fetchedAt: number };
const cache = new Map<string, CachedRate>();
const lastFailure = new Map<string, number>();

const json = async (url: string) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(5000), headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`${url} -> ${response.status}`);
  return response.json() as Promise<any>;
};

const SOURCES: Array<{ name: string; lkrPer: (base: string) => Promise<unknown> }> = [
  { name: 'exchangerate-api.com', lkrPer: async base => { const d = await json(`https://open.er-api.com/v6/latest/${base}`); return d?.result === 'success' ? d.rates?.LKR : undefined; } },
  { name: 'fawazahmed0 currency-api', lkrPer: async base => { const b = base.toLowerCase(); const d = await json(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${b}.json`); return d?.[b]?.lkr; } },
];

async function fetchRate(base: string): Promise<CachedRate | null> {
  for (const source of SOURCES) {
    try {
      const rate = Number(await source.lkrPer(base));
      if (Number.isFinite(rate) && rate > 0) return { rate, source: source.name, fetchedAt: Date.now() };
    } catch (error) {
      console.error(`Exchange rate: ${source.name} failed for ${base}:`, error);
    }
  }
  return null;
}

export type GenieRate = { currency: string; rate: number; source: string; fetchedAt?: string };

/** The LKR rate for 1 unit of the store currency, or null when none is known (no live rate and no fallback). */
export async function genieExchangeRate(settings: GeneralSettings): Promise<GenieRate | null> {
  const base = settings.store.currency.trim().toUpperCase();
  if (base === 'LKR') return { currency: base, rate: 1, source: 'same currency' };
  if (!/^[A-Z]{3}$/.test(base)) return null;

  let cached = cache.get(base);
  const now = Date.now();
  if ((!cached || now - cached.fetchedAt > REFRESH_MS) && now - (lastFailure.get(base) || 0) > RETRY_MS) {
    const fresh = await fetchRate(base);
    if (fresh) { cache.set(base, fresh); cached = fresh; lastFailure.delete(base); }
    else lastFailure.set(base, now);
  }
  if (cached && now - cached.fetchedAt <= STALE_LIMIT_MS) {
    return { currency: base, rate: cached.rate, source: cached.source, fetchedAt: new Date(cached.fetchedAt).toISOString() };
  }
  const fallback = Number(settings.payments.dialogGenieExchangeRate);
  return fallback > 0 ? { currency: base, rate: fallback, source: 'fallback rate in Settings' } : null;
}

/** A copy of the settings carrying the rate Genie should use, so genieChargeInLkr prices with it. */
export async function withLiveGenieRate(settings: GeneralSettings): Promise<GeneralSettings> {
  const live = await genieExchangeRate(settings);
  return { ...settings, payments: { ...settings.payments, dialogGenieExchangeRate: live?.rate ?? 0 } };
}
