import { useState, useEffect, useCallback } from 'react';
import { fetchIndicators, type IndicatorSeries } from '../api/client';

export interface UseIndicatorsResult {
  data: IndicatorSeries[] | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useIndicators(iso3: string): UseIndicatorsResult {
  const [data, setData] = useState<IndicatorSeries[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchIndicators(iso3);
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
