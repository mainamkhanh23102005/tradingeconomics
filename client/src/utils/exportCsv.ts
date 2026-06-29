import type { IndicatorSeries } from '../api/client';
import { countryName } from '../data/countries';

export function exportComparisonCsv(series: IndicatorSeries[]): void {
  if (series.length === 0) return;

  const label = series[0]?.label ?? 'Indicator';
  const countries = series.map((s) => s.countryiso3code);

  // Collect all unique dates
  const dateSet = new Set<string>();
  for (const s of series) {
    for (const p of s.points) dateSet.add(p.date);
  }
  const dates = Array.from(dateSet).sort();

  // Build lookup: iso3 → date → value
  const lookup = new Map<string, Map<string, number | null>>();
  for (const s of series) {
    const byDate = new Map(s.points.map((p) => [p.date, p.value]));
    lookup.set(s.countryiso3code, byDate);
  }

  const header = ['Year', ...countries.map((iso3) => countryName(iso3))].join(',');
  const rows = dates.map((date) => {
    const cells = countries.map((iso3) => {
      const v = lookup.get(iso3)?.get(date) ?? null;
      return v === null ? '' : String(v);
    });
    return [date, ...cells].join(',');
  });

  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${label.replace(/[^a-z0-9]/gi, '_')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
