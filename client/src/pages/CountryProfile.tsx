import { useParams, useNavigate } from 'react-router-dom';
import { CountrySelector } from '../components/CountrySelector';
import { IndicatorCard } from '../components/IndicatorCard';
import { TradeBars } from '../components/TradeBars';
import { useIndicators } from '../hooks/useIndicators';
import { useTradeSummary } from '../hooks/useTrade';
import { countryName } from '../data/countries';

interface Props {
  /** When true, hides the CountrySelector (used when embedded in TradeFlowExplorer side panel). */
  embedded?: boolean;
  /** ISO3 code passed directly when embedded; otherwise read from URL params. */
  iso3Override?: string;
}

export function CountryProfile({ embedded = false, iso3Override }: Props) {
  const { iso3: paramIso3 } = useParams<{ iso3: string }>();
  const navigate = useNavigate();
  const iso3 = (iso3Override ?? paramIso3 ?? 'VNM').toUpperCase();

  const { data: indicators, loading: indLoading, error: indError, retry: indRetry } = useIndicators(iso3);
  const { data: trade, loading: tradeLoading, error: tradeError, retry: tradeRetry } = useTradeSummary(iso3);

  function handleCountryChange(newIso3: string) {
    navigate(`/country/${newIso3}`);
  }

  return (
    <div style={{ padding: embedded ? 0 : '24px 32px', fontFamily: 'system-ui, sans-serif' }}>
      {!embedded && (
        <header style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <CountrySelector value={iso3} onChange={handleCountryChange} label="Country" />
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
            {countryName(iso3)}
          </h1>
          <nav style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
            <a href={`/trade/${iso3}`} style={{ color: '#2563eb', textDecoration: 'none' }}>Trade Explorer →</a>
            <a href="/compare" style={{ color: '#2563eb', textDecoration: 'none' }}>Compare →</a>
          </nav>
        </header>
      )}

      {/* Indicator section */}
      <section style={{ marginBottom: 32 }}>
        {!embedded && <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>Macroeconomic Indicators</h2>}
        {indLoading && <SkeletonGrid />}
        {indError && (
          <ErrorBanner message={indError} onRetry={indRetry} />
        )}
        {indicators && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16,
            }}
          >
            {indicators.map((series) => (
              <IndicatorCard key={series.code} series={series} />
            ))}
          </div>
        )}
      </section>

      {/* Trade section */}
      <section>
        {!embedded && <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>Trade Partners</h2>}
        {tradeLoading && <p style={{ color: '#9ca3af' }}>Loading trade data…</p>}
        {tradeError && (
          <ErrorBanner message={tradeError} onRetry={tradeRetry} />
        )}
        {trade && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            <TradeBars title="Top Export Partners" data={trade.exports} />
            <TradeBars title="Top Import Partners" data={trade.imports} />
          </div>
        )}
      </section>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 16,
      }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 120,
            background: '#f3f4f6',
            borderRadius: 8,
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      ))}
    </div>
  );
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      style={{
        padding: '12px 16px',
        background: '#fef2f2',
        border: '1px solid #fca5a5',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        color: '#dc2626',
      }}
    >
      <span>Failed to load: {message}</span>
      <button
        onClick={onRetry}
        style={{
          padding: '4px 12px',
          background: '#dc2626',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
        }}
      >
        Retry
      </button>
    </div>
  );
}
