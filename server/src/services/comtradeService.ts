/**
 * comtradeService.ts
 *
 * Wraps the public Comtrade CloudFront endpoint discovered via the
 * Network tab on tradingeconomics.com/{country}/exports-by-country.
 *
 * Endpoint pattern:
 *   https://d7c1siplh0qmu.cloudfront.net/comtrade/?r={reporter}&c={commodity}&t={tradeType}&treemap=countries&format=json
 *
 * Params:
 *   r = reporter country code (ISO-3, lowercase, e.g. "vnm")
 *   c = commodity code ("0000" = all commodities / total trade)
 *   t = trade type (1 = imports, 2 = exports)
 */

const COMTRADE_BASE_URL = 'https://d7c1siplh0qmu.cloudfront.net/comtrade/';

export interface ComtradeEntry {
  reporter: string;
  countries: string;
  continents?: string;
  url: string;
  value: number;
  cat_name: string;
  year: number;
}

export type TradeType = 'imports' | 'exports';

/**
 * Fetch trade-by-country data for a single reporter country.
 *
 * @param reporterCode  ISO-3 lowercase country code, e.g. "vnm"
 * @param tradeType     "imports" or "exports"
 */
export async function getTradeByCountry(
  reporterCode: string,
  tradeType: TradeType
): Promise<ComtradeEntry[]> {
  const t = tradeType === 'imports' ? 1 : 2;
  const url = `${COMTRADE_BASE_URL}?r=${reporterCode}&c=0000&t=${t}&treemap=countries&format=json`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Comtrade request failed: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as ComtradeEntry[];
  return data;
}

/**
 * Convenience helper: fetch both imports and exports for a country
 * in parallel, used by the Country Profile page.
 */
export async function getTradeSummary(reporterCode: string) {
  const [imports, exports] = await Promise.all([
    getTradeByCountry(reporterCode, 'imports'),
    getTradeByCountry(reporterCode, 'exports'),
  ]);

  return { imports, exports };
}