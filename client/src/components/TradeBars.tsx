import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ComtradeEntry } from '../api/client';

function fmtUsd(v: number): string {
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  return `$${v.toLocaleString()}`;
}

interface Props {
  title: string;
  data: ComtradeEntry[];
}

export function TradeBars({ title, data }: Props) {
  const top10 = [...data]
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
    .map((e) => ({ name: e.countries, value: e.value }));

  if (top10.length === 0) {
    return (
      <div>
        <h3 style={{ margin: '0 0 8px' }}>{title}</h3>
        <p style={{ color: '#9ca3af' }}>No data</p>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600 }}>{title}</h3>
      <ResponsiveContainer width="100%" height={top10.length * 36 + 20}>
        <BarChart data={top10} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
          <XAxis
            type="number"
            tickFormatter={(v: number) => fmtUsd(v)}
            style={{ fontSize: 11 }}
          />
          <YAxis type="category" dataKey="name" width={130} style={{ fontSize: 12 }} />
          <Tooltip formatter={(v: unknown) => [fmtUsd(v as number), 'Value']} />
          <Bar dataKey="value" fill="#2563eb" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
