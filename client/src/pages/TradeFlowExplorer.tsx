import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TradeTreemap } from '../components/TradeTreemap';
import { CountryProfile } from './CountryProfile';
import { useTradeByDirection } from '../hooks/useTrade';
import { countryName } from '../data/countries';

export function TradeFlowExplorer() {
  const { iso3: paramIso3 } = useParams<{ iso3: string }>();
  const iso3 = (paramIso3 ?? 'VNM').toUpperCase();

  const [direction, setDirection] = useState<'imports' | 'exports'>('exports');
  const [selectedIso3, setSelectedIso3] = useState<string | null>(null);

  const { data, loading, error, retry } = useTradeByDirection(iso3, direction);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Main panel */}
      <div style={{ flex: 1, padding: '24px 32px', overflow: 'auto' }}>
        <header style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to={`/country/${iso3}`} style={{ color: '#6b7280', textDecoration: 'none', fontSize: 14 }}>
            ← {countryName(iso3)}
          </Link>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
            Trade Flow Explorer — {countryName(iso3)}
          </h1>
          <nav style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
            <Link to="/compare" style={{ color: '#2563eb', textDecoration: 'none', fontSize: 14 }}>
              Compare →
            </Link>
          </nav>
        </header>

        {/* Direction toggle */}
        <div style={{ marginBottom: 20, display: 'flex', gap: 8 }}>
          {(['exports', 'imports'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDirection(d)}
              style={{
                padding: '8px 20px',
                borderRadius: 6,
                border: '1px solid #d1d5db',
                cursor: 'pointer',
                fontWeight: direction === d ? 700 : 400,
                background: direction === d ? '#2563eb' : '#fff',
                color: direction === d ? '#fff' : '#374151',
                fontSize: 14,
              }}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>

        {loading && <p style={{ color: '#9ca3af' }}>Loading trade data…</p>}
        {error && (
          <div style={{ color: '#dc2626', display: 'flex', gap: 12, alignItems: 'center' }}>
            <span>{error}</span>
            <button onClick={retry} style={{ padding: '4px 12px', cursor: 'pointer' }}>Retry</button>
          </div>
        )}
        {data && data.length > 0 && (
          <>
            <p style={{ margin: '0 0 8px', color: '#6b7280', fontSize: 13 }}>
              {data.length} partners · {data[0]?.year} data · click a cell to view partner profile
            </p>
            <TradeTreemap data={data} onCountryClick={setSelectedIso3} />
          </>
        )}
        {data && data.length === 0 && (
          <p style={{ color: '#9ca3af' }}>No trade data available.</p>
        )}
      </div>

      {/* Side panel */}
      {selectedIso3 && (
        <aside
          style={{
            width: 420,
            borderLeft: '1px solid #e5e7eb',
            overflowY: 'auto',
            background: '#fafafa',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>{countryName(selectedIso3)}</span>
            <button
              onClick={() => setSelectedIso3(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#6b7280' }}
              aria-label="Close panel"
            >
              ×
            </button>
          </div>
          <CountryProfile embedded iso3Override={selectedIso3} />
        </aside>
      )}
    </div>
  );
}
