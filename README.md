# te-trade-explorer

Take-home technical screening for Trading Economics. A three-page trade and economics explorer built with TypeScript/Express (Railway) + React/Vite (Vercel).

## Pages

| Route | What it shows |
|---|---|
| `/country/:iso3` | Six World Bank macroeconomic indicators with sparklines + top-10 import/export partner bar charts |
| `/trade/:iso3` | Comtrade treemap of all trade partners, sized by USD value, coloured by continent; click any cell → side panel with that country's profile |
| `/compare` | Multi-country (2-3) line chart for any one of the six indicators, last 20 years; Download CSV |

## Data sources

- **Comtrade** — `d7c1siplh0qmu.cloudfront.net/comtrade/` — bilateral trade flows, all commodities, by partner country
- **World Bank Open Data API** — `api.worldbank.org/v2/` — six macroeconomic indicators, verified codes in `SPEC.md §3.2`

Both are fetched server-side (see ADR-001 in SPEC.md).

## Local development

```bash
# Terminal 1 — server (port 3001)
cd server && npm install && npm run dev

# Terminal 2 — client (port 5173, proxies /api to 3001)
cd client && npm install && npm run dev
```

Open `http://localhost:5173/country/VNM`.

## Tests

```bash
cd server && npm test   # 32 tests (Jest + ts-jest + supertest)
cd client && npm test   # 18 tests (Vitest + React Testing Library)
```

## Deployment

| Layer | Platform | Env var |
|---|---|---|
| Server | Railway | `CORS_ORIGIN=https://<vercel-domain>`, `PORT` injected by Railway |
| Client | Vercel | `VITE_API_BASE_URL=https://<railway-domain>` |

Push to `main` triggers auto-deploy on both platforms.

## Architecture decisions

See `SPEC.md §10` for the full ADR log (proxy rationale, data source selection, Recharts choice, strict mode, named exports).
