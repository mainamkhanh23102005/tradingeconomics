import { LineChart, Line, ResponsiveContainer } from 'recharts';
import type { IndicatorSeries } from '../api/client';

const GDP_CODE = 'NY.GDP.MKTP.CD';

function formatValue(value: number | null, code: string): string {
  if (value === null) return 'N/A';
  if (code === GDP_CODE) {
    const abs = Math.abs(value);
    if (abs >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
    if (abs >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (abs >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    return `$${value.toLocaleString()}`;
  }
  return `${value.toFixed(2)}%`;
}

interface Props {
  series: IndicatorSeries;
}

export function IndicatorCard({ series }: Props) {
  const latestPoint = series.points.find((p) => p.value !== null);
  const chartData = [...series.points].reverse();

  return (
    <div
      className="indicator-card"
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <h3 style={{ margin: 0, fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{series.label}</h3>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111' }}>
        {formatValue(latestPoint?.value ?? null, series.code)}
      </p>
      {latestPoint && (
        <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>{latestPoint.date}</p>
      )}
      <ResponsiveContainer width="100%" height={60}>
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            dot={false}
            strokeWidth={2}
            stroke="#2563eb"
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
