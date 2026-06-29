import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ComparisonChart } from '../components/ComparisonChart';
import { CountrySelector } from '../components/CountrySelector';
import { fetchComparison } from '../api/client';
import { exportComparisonCsv } from '../utils/exportCsv';
import { WB_INDICATOR_LABELS } from '../data/indicators';
import type { IndicatorSeries } from '../api/client';

const MAX_COUNTRIES = 3;

export function IndicatorComparison() {
  const [countries, setCountries] = useState<string[]>(['VNM', 'THA']);
  const [indicator, setIndicator] = useState('NY.GDP.MKTP.CD');
  const [series, setSeries] = useState<IndicatorSeries[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (countries.length < 2) {
      setError('Select at least 2 countries.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchComparison(countries, indicator, 20);
      setSeries(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [countries, indicator]);

  function addCountry(iso3: string) {
    if (countries.includes(iso3) || countries.length >= MAX_COUNTRIES) return;
    setCountries((prev) => [...prev, iso3]);
  }

  function removeCountry(iso3: string) {
    setCountries((prev) => prev.filter((c) => c !== iso3));
  }

  const pickerValue = countries.length < MAX_COUNTRIES ? '' : '__max__';

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'system-ui, sans-serif', maxWidth: 1000 }}>
      <header style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Indicator Comparison</h1>
        <nav style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
          <Link to="/country/VNM" style={{ color: '#2563eb', textDecoration: 'none', fontSize: 14 }}>Country Profile</Link>
          <Link to="/trade/VNM" style={{ color: '#2563eb', textDecoration: 'none', fontSize: 14 }}>Trade Explorer</Link>
        </nav>
      </header>

      {/* Controls */}
      <section style={{ display: 'flex', gap: 24, marginBottom: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {/* Selected countries */}
        <div>
          <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600 }}>
            Countries ({countries.length}/{MAX_COUNTRIES})
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            {countries.map((iso3) => (
              <span
                key={iso3}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: 20,
                  fontSize: 13,
                }}
              >
                {iso3}
                <button
                  onClick={() => removeCountry(iso3)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 14, lineHeight: 1 }}
                  aria-label={`Remove ${iso3}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          {countries.length < MAX_COUNTRIES && (
            <CountrySelector
              value={pickerValue}
              onChange={addCountry}
              label="Add country"
            />
          )}
        </div>

        {/* Indicator picker */}
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Indicator</label>
          <select
            value={indicator}
            onChange={(e) => setIndicator(e.target.value)}
            style={{ padding: '6px 10px', fontSize: 14, borderRadius: 6, border: '1px solid #d1d5db' }}
          >
            {Object.entries(WB_INDICATOR_LABELS).map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </div>

        {/* Compare button */}
        <button
          onClick={() => void load()}
          disabled={loading || countries.length < 2}
          style={{
            padding: '8px 20px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            opacity: countries.length < 2 ? 0.5 : 1,
          }}
        >
          {loading ? 'Loading…' : 'Compare'}
        </button>
      </section>

      {error && (
        <div style={{ color: '#dc2626', marginBottom: 16 }}>{error}</div>
      )}

      {/* Chart */}
      {series.length > 0 && (
        <>
          <ComparisonChart series={series} />
          <div style={{ marginTop: 12, textAlign: 'right' }}>
            <button
              onClick={() => exportComparisonCsv(series)}
              style={{
                padding: '6px 16px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13,
                background: '#fff',
              }}
            >
              Download CSV
            </button>
          </div>
        </>
      )}
    </div>
  );
}
