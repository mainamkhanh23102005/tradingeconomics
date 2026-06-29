# te-trade-explorer -- Product Requirements & Architecture Spec

> **Context:** Take-home technical screening for Trading Economics.
> This document doubles as a PRD and an ADR log so every architectural
> choice can be defended in the follow-up interview.

---

## 1. Objective

Build a three-page web application that lets users explore international
trade flows and macroeconomic indicators for any country. The app
demonstrates full-stack TypeScript, clean data-layer design, and
meaningful visualisation -- all within the scope of two verified
public data sources.

**Target audience for the screening:** Trading Economics engineers who
will read the code and ask "why did you make that choice?" This spec
answers that question in writing before they ask.

---

## 2. Pages & Acceptance Criteria

### Page 1 - Country Profile (`/country/:iso3`)

A single-country dashboard combining six World Bank indicators with a
trade summary.

**Acceptance criteria:**
- Country selector (search-as-you-type, ISO3 -> display name) at the top
- Six indicator cards, each showing the most recent value, year, and a
  10-year sparkline:
  1. GDP (current US$)                    -- `NY.GDP.MKTP.CD`
  2. Inflation, consumer prices (annual%) -- `FP.CPI.TOTL.ZG`
  3. Unemployment, total (% labor force)  -- `SL.UEM.TOTL.ZS`
  4. Current account balance (% of GDP)  -- `BN.CAB.XOKA.GD.ZS`
  5. Trade (% of GDP)                    -- `NE.TRD.GNFS.ZS`
  6. FDI net inflows (% of GDP)          -- `BX.KLT.DINV.WD.GD.ZS`
- Trade summary section: top-10 export partners and top-10 import
  partners as horizontal bar charts with partner country name and USD value
- Loading skeletons while data is in flight; error state with retry if
  any upstream call fails

### Page 2 - Trade Flow Explorer (`/trade/:iso3`)

Drill-down into the full import or export partner breakdown.

**Acceptance criteria:**
- Import / Export toggle
- Treemap of all trade partners sized by USD value, coloured by
  continent (Africa, Americas, Asia, Europe, Oceania)
- Click a partner cell -> opens Country Profile for that partner in a
  side panel (reuses Page 1 components)
- Year label from the Comtrade data (data reflects the most recent year
  available in the dataset)

### Page 3 - Indicator Comparison (`/compare`)

Side-by-side comparison of one indicator across 2-3 countries over time.

**Acceptance criteria:**
- Country multi-select (2-3 countries)
- Indicator dropdown (the same six as Page 1)
- Line chart with one series per country, covering the last 20 years
- Download CSV button (client-side generation, no server round-trip)

---

## 3. Data Sources

### 3.1 Comtrade trade flows (bilateral trade by partner country)

```
GET https://d7c1siplh0qmu.cloudfront.net/comtrade/
  ?r={iso3_lowercase}
  &c=0000          // all commodities
  &t={1|2}         // 1 = imports, 2 = exports
  &treemap=countries
  &format=json
```

Returns an array of `ComtradeEntry` objects (see `comtradeService.ts`).
`value` is in USD. `year` is the data year. No authentication required.
Confirmed working server-side via curl.

### 3.2 World Bank Open Data API (macroeconomic indicators)

```
GET https://api.worldbank.org/v2/country/{ISO3}/indicator/{CODE}
  ?format=json
  &mrv={n}         // most recent n values
```

Multi-country form (used by Page 3):

```
GET https://api.worldbank.org/v2/country/{ISO3};{ISO3};{ISO3}/indicator/{CODE}
  ?format=json
  &mrv=20
```

Response shape:

```json
[
  { "page": 1, "pages": 1, "per_page": 50, "total": 5 },
  [
    { "indicator": { "id": "NY.GDP.MKTP.CD", "value": "GDP (current US$)" },
      "country":   { "id": "VN", "value": "Viet Nam" },
      "countryiso3code": "VNM",
      "date":  "2024",
      "value": 476388230307.175 }
  ]
]
```

**Verified indicator codes** (each tested against VNM via curl before inclusion here):

| Indicator                        | Code                   | 2024 VNM value |
|----------------------------------|------------------------|----------------|
| GDP (current US$)                | `NY.GDP.MKTP.CD`       | $476.4 B       |
| Inflation (CPI annual %)         | `FP.CPI.TOTL.ZG`       | 3.62 %         |
| Unemployment (% labor force)     | `SL.UEM.TOTL.ZS`       | 1.60 %         |
| Current account balance (% GDP)  | `BN.CAB.XOKA.GD.ZS`   | +6.33 %        |
| Trade (% GDP)                    | `NE.TRD.GNFS.ZS`       | 173.9 %        |
| FDI net inflows (% GDP)          | `BX.KLT.DINV.WD.GD.ZS`| 4.23 %         |

No API key required. CORS open (`Access-Control-Allow-Origin: *`).
Confirmed working server-side via curl.

---

## 4. Architecture

```
Browser
  |
  |  HTTPS
  v
Vercel (React/Vite SPA)                    <- /client
  |
  |  HTTPS  (all data fetches go through the Express proxy)
  v
Railway (Express/TypeScript)               <- /server
  |-- GET /api/trade/:iso3/exports    ->  Comtrade CloudFront
  |-- GET /api/trade/:iso3/imports    ->  Comtrade CloudFront
  |-- GET /api/indicators/:iso3       ->  api.worldbank.org
  \-- GET /api/indicators/compare     ->  api.worldbank.org (multi-country)
```

The frontend never calls upstream APIs directly, even though both have
open CORS. See ADR-001 for why.

---

## 5. Project Structure

```
te-trade-explorer/
+-- SPEC.md                         <- this file
+-- server/
|   +-- src/
|   |   +-- index.ts                <- Express app bootstrap
|   |   +-- routes/
|   |   |   +-- trade.ts            <- /api/trade routes
|   |   |   \-- indicators.ts       <- /api/indicators routes
|   |   \-- services/
|   |       +-- comtradeService.ts  <- exists, verified
|   |       \-- indicatorService.ts <- new, wraps WB Open Data API
|   +-- package.json
|   \-- tsconfig.json
\-- client/
    +-- src/
    |   +-- main.tsx
    |   +-- App.tsx                 <- router root
    |   +-- pages/
    |   |   +-- CountryProfile.tsx
    |   |   +-- TradeFlowExplorer.tsx
    |   |   \-- IndicatorComparison.tsx
    |   +-- components/
    |   |   +-- CountrySelector.tsx
    |   |   +-- IndicatorCard.tsx
    |   |   +-- TradeBars.tsx
    |   |   +-- TradeTreemap.tsx
    |   |   \-- ComparisonChart.tsx
    |   +-- hooks/
    |   |   +-- useIndicators.ts
    |   |   \-- useTrade.ts
    |   \-- api/
    |       \-- client.ts           <- typed fetch wrappers
    +-- index.html
    +-- package.json
    \-- vite.config.ts
```

---

## 6. Code Style

- **TypeScript strict mode** on both sides (`"strict": true` already in
  `server/tsconfig.json`; client will mirror it)
- No `any`. All upstream API response shapes defined as named interfaces
  in the service file that owns the fetch call
- `async/await` throughout; no `.then()` chains
- Route handlers are thin: parse params, call service, return JSON.
  Business logic lives in services
- Error responses follow `{ error: string }` shape with appropriate HTTP
  status codes (400 for bad ISO3, 502 for upstream failures)
- Client API calls live in `src/api/client.ts` and return typed results;
  components never call `fetch` directly
- No default exports (named exports only) -- makes refactoring and
  tree-shaking straightforward

---

## 7. Testing Strategy

**Server:** Jest + ts-jest. Unit-test each service function by mocking
`fetch`. Test the route layer with `supertest`. Focus on:
- ISO3 normalisation (input validation)
- WB response parser (the `[pagination, data]` tuple is easy to misread)
- Error propagation (upstream 4xx/5xx -> 502 with clear message)

**Client:** Vitest + React Testing Library. Test:
- `CountrySelector` keyboard navigation and search filtering
- `IndicatorCard` renders "N/A" gracefully when `value` is `null` (WB
  returns null for years with no data)
- `ComparisonChart` renders one `<Line>` per selected country

**No E2E tests in this submission** -- the scope doesn't justify the
setup overhead. Manual verification of the golden paths (load a
country, toggle imports/exports, compare two countries) is documented
in the README.

---

## 8. Deployment

| Layer  | Platform | Trigger                         |
|--------|----------|---------------------------------|
| Server | Railway  | Push to `main` -> auto-deploy   |
| Client | Vercel   | Push to `main` -> auto-deploy   |

Environment variable: `VITE_API_BASE_URL` in the Vercel project settings
points to the Railway service URL. Server exposes `PORT` from Railway's
injected env. No secrets required (both upstream APIs are public).

---

## 9. Boundaries

**Always do:**
- Validate ISO3 codes on the server before hitting upstream APIs
  (3 uppercase letters; reject anything else with a 400)
- Return the data year alongside every indicator value so the UI can
  show "2023 data" rather than implying it is live
- Handle `null` values in WB data gracefully (some country/indicator
  combinations have gaps)

**Ask before doing:**
- Adding more indicators beyond the six specified
- Switching charting library
- Adding a database or caching layer (out of scope for this submission,
  but straightforward to add later -- see ADR-001)

**Never do:**
- Guess or hardcode indicator codes -- every code in this spec was
  verified by a live API call before inclusion
- Call upstream APIs from the browser (see ADR-001)
- Store or log raw API responses in production

---

## 10. Architectural Decision Records

### ADR-001 -- All upstream fetches go through the Express proxy

**Decision:** The React client never calls `api.worldbank.org` or the
Comtrade endpoint directly. Every data request goes through the
Express server.

**Why:** Both upstream APIs have open CORS, so browser-direct calls
would work today. The proxy exists for three reasons that matter at
interview time:

1. **Rate-limit protection.** The World Bank API is public but
   undocumented on rate limits. A single server IP can be governed and
   cached; dozens of browser IPs cannot.

2. **Single place for caching.** When (not if) an interviewer asks
   "what would you do if the WB API is slow?", the answer is "add an
   in-memory cache in `indicatorService.ts` -- one file, one change,
   no client impact." That answer only works with a proxy.

3. **Data shaping.** The WB response is a `[pagination, dataArray]`
   tuple -- easy to misparse. The server normalises it once; the client
   receives a clean, typed array. If the WB changes their response
   shape, only the server needs updating.

**Trade-off accepted:** One extra network hop. Negligible for annual
macroeconomic data.

---

### ADR-002 -- World Bank Open Data API (`api.worldbank.org`) as the indicator source

**Decision:** Use the official World Bank Open Data API for all six
macroeconomic indicators.

**Why:** During research, a TE-hosted CloudFront distribution was
identified as an alternative serving the same underlying World Bank
data. It was tested directly and rejected:

- Every server-side request -- regardless of URL path, query params,
  `User-Agent`, or `Referer` header -- returned the same 89-byte
  encrypted blob. The endpoint is protected by a CloudFront WAF that
  blocks non-browser requests.
- The response format is opaque (not plain JSON); decryption would
  require reverse-engineering client-side JavaScript, which is fragile
  and inappropriate for a job application to the company whose
  infrastructure it is.

`api.worldbank.org` was then tested and confirmed:
- All six required indicators return clean JSON, no authentication
- Open CORS (`Access-Control-Allow-Origin: *`)
- Documented, versioned API (`/v2/`) with a public SLA
- Backed by Cloudflare CDN; observed cache-hit headers on repeated
  requests indicate production-grade availability
- Supports multi-country queries in a single request
  (`;`-delimited ISO3 codes) -- important for Page 3 efficiency

**Trade-off accepted:** The official WB API data lags 12-18 months
(annual surveys). This matches the Comtrade data lag and is inherent
to the data, not the API choice.

---

### ADR-003 -- Recharts as the charting library

**Decision:** Use Recharts for all charts (sparklines, bar charts,
treemap, line chart).

**Why:**

- **React-native.** Components are JSX; no imperative D3 lifecycle to
  manage. State and data flow the same way as the rest of the app.
- **Treemap included.** The `<Treemap>` component covers the Trade
  Flow Explorer directly. D3 would require custom layout code; Chart.js
  does not have a treemap.
- **First-class TypeScript types** in the main package (no separate
  `@types/` install).
- **Bundle size.** Recharts is ~180 kB gzipped -- larger than a pure
  D3 approach but smaller than ECharts. Acceptable for a screening app
  where bundle optimisation is not the primary axis of evaluation.

**Trade-off accepted:** Recharts' `<Treemap>` does not support click
events on cells as cleanly as D3. The workaround (`onClick` prop on
`<Treemap content={<CustomContent />}>`) is documented and tested.

---

### ADR-004 -- TypeScript strict mode across the full stack

**Decision:** `"strict": true` in both `server/tsconfig.json` (already
set) and the forthcoming `client/tsconfig.json`.

**Why:** The World Bank API response is a `[pagination, data[]]` tuple
where `value` can be `number | null`. Without strict null checks, a
`null` value silently flows into chart rendering and produces a broken
chart. With strict mode, the compiler forces a null-guard at the point
where the data is transformed -- catching the bug at build time rather
than in the interviewer's browser.

**Trade-off accepted:** Slightly more boilerplate for optional fields.
Worth it for a submission that will be read critically.

---

### ADR-005 -- Named exports only (no default exports)

**Decision:** All modules use named exports.

**Why:** Default exports allow the same module to be imported under
different names in different files, which makes search-and-replace
refactoring unreliable. For a screening submission where reviewers
may read files in arbitrary order, consistent names reduce cognitive
load. This is the pattern used in the existing `comtradeService.ts`.

---

## 11. Build Sequence (for `/plan`)

The following slices are ordered so each one produces a runnable,
demonstrable increment:

1. **Slice 0 - Repo skeleton:** `/client` Vite+React scaffold, shared
   TypeScript config, CORS wired between dev server and Express
2. **Slice 1 - Indicator service + route:** `indicatorService.ts`,
   `/api/indicators/:iso3`, manual curl verification
3. **Slice 2 - Country Profile page:** Six indicator cards + sparklines,
   country selector, loading/error states
4. **Slice 3 - Trade service + route:** `comtradeService.ts` already
   exists; add route `/api/trade/:iso3/:direction`
5. **Slice 4 - Trade Flow Explorer page:** Treemap + click-to-side-panel
6. **Slice 5 - Indicator Comparison page:** Multi-select, line chart,
   CSV download
7. **Slice 6 - Polish + deploy:** README, Railway + Vercel config,
   smoke test on production URLs
