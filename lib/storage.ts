import { AppSettings, DEFAULT_FILTERS, WatchlistItem, ScreenerPreset } from "./types";

const SETTINGS_KEY = "stocksense_settings";
const WATCHLIST_KEY = "stocksense_watchlist";
const RESULTS_KEY = "stocksense_results";

export function getSettings(): AppSettings {
  if (typeof window === "undefined") return defaultSettings();
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return defaultSettings();
  try {
    const saved = JSON.parse(raw);
    // Merge filters by ID so new defaults (hammer, doji) aren't lost
    const mergedFilters = DEFAULT_FILTERS.map((def) => {
      const existing = (saved.defaultFilters || []).find((f: any) => f.id === def.id);
      return existing ? { ...def, enabled: existing.enabled, params: { ...def.params, ...existing.params } } : def;
    });
    return { ...defaultSettings(), ...saved, defaultFilters: mergedFilters };
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(s: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function getWatchlist(): WatchlistItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(WATCHLIST_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveWatchlist(items: WatchlistItem[]): void {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(items));
}

export function getCachedResults(): Record<string, unknown>[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(RESULTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function cacheResults(results: Record<string, unknown>[]): void {
  localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
}

function defaultSettings(): AppSettings {
  return {
    universe: "IDX100",
    customTickers: [],
    activePresetId: null,
    presets: [],
    defaultFilters: DEFAULT_FILTERS,
    telegramChatId: "",
  };
}
