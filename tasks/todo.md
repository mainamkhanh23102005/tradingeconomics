# te-trade-explorer -- Task Checklist

## S0 - Foundation (server entry + client scaffold + CORS) [DONE]
- [x] Add dev/build/start scripts to server/package.json
- [x] Write server/src/index.ts (Express + CORS + /health)
- [x] Scaffold client/ with Vite React-TS template
- [x] Install react-router-dom + recharts in client
- [x] Configure vite.config.ts dev proxy to :3001
- [x] Write App.tsx with 3 placeholder routes
- [x] VERIFY: curl /health -> {"status":"ok"}; tsc --noEmit clean on both sides

## S1 - Indicator data pipe
- [ ] Write server/src/services/indicatorService.ts
- [ ] Write server/src/routes/indicators.ts
- [ ] Wire indicators route into index.ts
- [ ] VERIFY: curl /api/indicators/VNM returns 6 series; /api/indicators/XXX returns 400

## S2 - Country Profile page
- [ ] Write client/src/data/countries.ts (static ISO3 -> name map)
- [ ] Write client/src/api/client.ts (typed fetch wrappers)
- [ ] Write client/src/hooks/useIndicators.ts
- [ ] Write client/src/hooks/useTrade.ts
- [ ] Write CountrySelector.tsx
- [ ] Write IndicatorCard.tsx (with sparkline)
- [ ] Write TradeBars.tsx
- [ ] Write CountryProfile.tsx (full page)
- [ ] VERIFY: /country/VNM shows 6 cards + sparklines + trade bars; selector navigates

## S3 - Trade route
- [ ] Write server/src/routes/trade.ts
- [ ] Wire trade route into index.ts
- [ ] VERIFY: curl /api/trade/VNM/exports returns data; /api/trade/BAD/exports returns 400

## S4 - Trade Flow Explorer page
- [ ] Write TradeTreemap.tsx (Recharts Treemap + continent colours)
- [ ] Write TradeFlowExplorer.tsx (toggle + treemap + side panel)
- [ ] Add embedded prop to CountryProfile
- [ ] VERIFY: /trade/VNM shows treemap; click cell opens side panel

## S5 - Indicator Comparison page
- [ ] Add fetchComparison to client/src/api/client.ts
- [ ] Write ComparisonChart.tsx
- [ ] Write client/src/utils/exportCsv.ts
- [ ] Write IndicatorComparison.tsx
- [ ] VERIFY: /compare with 2-3 countries + indicator shows line chart; CSV downloads

## S6 - Polish & Deploy
- [ ] Write README.md
- [ ] Add Railway config (Procfile or railway.json)
- [ ] Add Vercel config (vercel.json or dashboard settings)
- [ ] Smoke test both production URLs
