# te-trade-explorer -- Implementation Plan

See SPEC.md for full PRD and ADRs. This file records the build order and
per-slice acceptance criteria.

## Dependency order

S0 Foundation -> S1 Indicator pipe -> S2 Country Profile page
                 S3 Trade route   ->
S2 -> S4 Trade Flow Explorer
S1 -> S5 Indicator Comparison
S4/S5 -> S6 Deploy

## Slices

### S0 - Foundation
Goal: runnable dev environment, no feature data.
- server/src/index.ts: Express + CORS + /health endpoint
- server/package.json: add dev/build/start scripts
- client/: Vite React-TS scaffold + react-router-dom + recharts
- vite.config.ts: proxy /api -> localhost:3001
- App.tsx: 3 placeholder routes + redirect / -> /country/VNM
Verify: curl /health; browser loads; no CORS errors.

### S1 - Indicator data pipe
Goal: GET /api/indicators/:iso3 returns 6 normalized WB series.
- server/src/services/indicatorService.ts
  - WB_INDICATORS const (6 verified codes)
  - parseWbResponse(raw): IndicatorPoint[]  <- handles [pagination, data[]] tuple
  - getIndicators(iso3, mrv=10): Promise<IndicatorSeries[]>
  - getIndicatorsForComparison(iso3s, code, mrv=20)
- server/src/routes/indicators.ts
  - GET /api/indicators/:iso3  -> 400 bad ISO3 | 200 array | 502 upstream fail
  - GET /api/indicators/compare?countries=&indicator=&years=
Verify: curl tests for valid/invalid ISO3.

### S2 - Country Profile page
Goal: /country/:iso3 renders the full dashboard.
- client/src/data/countries.ts  <- static ISO3->name list
- client/src/api/client.ts      <- typed fetch wrappers
- client/src/hooks/useIndicators.ts + useTrade.ts
- CountrySelector, IndicatorCard (sparkline), TradeBars
- CountryProfile.tsx: selector + 2x3 indicator grid + side-by-side trade bars
  Loading skeletons; error+retry states.
Verify: visual check on /country/VNM.

### S3 - Trade route
Goal: GET /api/trade/:iso3/:direction returns ComtradeEntry[].
- server/src/routes/trade.ts
  - GET /api/trade/:iso3/:direction  (imports|exports)
  - GET /api/trade/:iso3/summary     (both in parallel)
  - comtradeService.ts NOT modified; route calls existing exports
Verify: curl tests for valid/invalid inputs.

### S4 - Trade Flow Explorer page
Goal: /trade/:iso3 shows treemap + click-to-side-panel.
- TradeTreemap.tsx: Recharts Treemap, continent colour map, onClick -> onCountryClick(iso3)
  Partner iso3 derived from url field ("...exports/angola" -> look up in countries.ts)
- TradeFlowExplorer.tsx: toggle imports/exports, useTrade hook, side panel
- CountryProfile gets embedded prop to suppress its own CountrySelector
Verify: treemap renders; toggle works; click opens side panel with country data.

### S5 - Indicator Comparison page
Goal: /compare shows multi-country line chart with CSV download.
- ComparisonChart.tsx: Recharts LineChart, one Line per country, connectNulls=false
- client/src/utils/exportCsv.ts: pure client-side Blob download
- IndicatorComparison.tsx: multi-select (max 3), indicator dropdown, chart, download button
Verify: 2-3 countries + indicator -> line chart; CSV file downloads correctly.

### S6 - Polish & Deploy
Goal: both production URLs smoke-test green.
- README.md
- Procfile: web: npm start  (Railway)
- vercel.json or dashboard config  (Vercel)
- Env vars: CORS_ORIGIN (Railway), VITE_API_BASE_URL (Vercel)
Verify: curl production /health; open production /country/VNM in browser.

## Key constraints
- No `any`; all response shapes typed as named interfaces
- value: number | null guarded before passing to chart components
- ISO3 validated server-side before every upstream fetch
- No default exports
- comtradeService.ts unchanged
- Pause after each slice for human review
