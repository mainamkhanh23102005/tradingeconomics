const WB_BASE = 'https://api.worldbank.org/v2';

export const WB_INDICATORS: Record<string, string> = {
  'NY.GDP.MKTP.CD': 'GDP (current US$)',
  'FP.CPI.TOTL.ZG': 'Inflation, consumer prices (annual %)',
  'SL.UEM.TOTL.ZS': 'Unemployment, total (% of labor force)',
  'BN.CAB.XOKA.GD.ZS': 'Current account balance (% of GDP)',
  'NE.TRD.GNFS.ZS': 'Trade (% of GDP)',
  'BX.KLT.DINV.WD.GD.ZS': 'FDI, net inflows (% of GDP)',
};

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

interface WbDataItem {
  indicator: { id: string; value: string };
  country: { id: string; value: string };
  countryiso3code: string;
  date: string;
  value: number | null;
}

type WbTuple = readonly [
  { page: number; pages: number; per_page: number; total: number },
  WbDataItem[],
];

export function parseWbResponse(raw: WbTuple): WbDataItem[] {
  const items = raw[1];
  if (!Array.isArray(items)) return [];
  return items;
}

export async function getIndicators(iso3: string, mrv = 10): Promise<IndicatorSeries[]> {
  const codes = Object.keys(WB_INDICATORS);
  const upper = iso3.toUpperCase();
  const results = await Promise.all(
    codes.map(async (code) => {
      const url = `${WB_BASE}/country/${upper}/indicator/${code}?format=json&mrv=${mrv}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`WB request failed for ${code}: ${res.status}`);
      }
      const raw = (await res.json()) as WbTuple;
      const items = parseWbResponse(raw);
      return {
        code,
        label: WB_INDICATORS[code] ?? code,
        countryiso3code: upper,
        points: items.map((item) => ({ date: item.date, value: item.value })),
      };
    }),
  );
  return results;
}

export async function getIndicatorsForComparison(
  iso3s: string[],
  code: string,
  mrv = 20,
): Promise<IndicatorSeries[]> {
  const countriesPath = iso3s.join(';');
  const url = `${WB_BASE}/country/${countriesPath}/indicator/${code}?format=json&mrv=${mrv}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`WB request failed: ${res.status}`);
  }
  const raw = (await res.json()) as WbTuple;
  const items = parseWbResponse(raw);

  const byCountry = new Map<string, WbDataItem[]>();
  for (const item of items) {
    const key = item.countryiso3code;
    if (!byCountry.has(key)) byCountry.set(key, []);
    byCountry.get(key)!.push(item);
  }

  return Array.from(byCountry.entries()).map(([iso3, countryItems]) => ({
    code,
    label: WB_INDICATORS[code] ?? code,
    countryiso3code: iso3,
    points: countryItems.map((item) => ({ date: item.date, value: item.value })),
  }));
}
