import { useState, useEffect, useCallback } from 'react';
import { fetchTradeSummary, fetchTradeByDirection, type TradeSummary, type ComtradeEntry } from '../api/client';

export interface UseTradeSummaryResult {
  data: TradeSummary | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useTradeSummary(iso3: string): UseTradeSummaryResult {
  const [data, setData] = useState<TradeSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchTradeSummary(iso3);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [iso3]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, retry: load };
}

export interface UseTradeDirectionResult {
  data: ComtradeEntry[] | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useTradeByDirection(
  iso3: string,
  direction: 'imports' | 'exports',
): UseTradeDirectionResult {
  const [data, setData] = useState<ComtradeEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchTradeByDirection(iso3, direction);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [iso3, direction]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, retry: load };
}
