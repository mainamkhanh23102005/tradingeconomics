const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

export interface IndicatorPoint {
  date: string;
  value: number | null;
}

export interface IndicatorSeries {
  code: string;
  label: string;
  countryiso3code: string;
  points: IndicatorPoint[];
}

export interface ComtradeEntry {
  reporter: string;
  countries: string;
  continents?: string;
  url: string;
  value: number;
  cat_name: string;
  year: number;
}

export interface TradeSummary {
  imports: ComtradeEntry[];
  exports: ComtradeEntry[];
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export function fetchIndicators(iso3: string): Promise<IndicatorSeries[]> {
  return apiFetch<IndicatorSeries[]>(`/api/indicators/${iso3}`);
}

export function fetchTradeSummary(iso3: string): Promise<TradeSummary> {
  return apiFetch<TradeSummary>(`/api/trade/${iso3}/summary`);
}

export function fetchTradeByDirection(
  iso3: string,
  direction: 'imports' | 'exports',
): Promise<ComtradeEntry[]> {
  return apiFetch<ComtradeEntry[]>(`/api/trade/${iso3}/${direction}`);
}

export function fetchComparison(
  countries: string[],
  indicator: string,
  years = 20,
): Promise<IndicatorSeries[]> {
  const params = new URLSearchParams({
    countries: countries.join(','),
    indicator,
    years: String(years),
  });
  return apiFetch<IndicatorSeries[]>(`/api/indicators/compare?${params}`);
}
