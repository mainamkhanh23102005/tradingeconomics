import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import type { IndicatorSeries } from '../api/client';
import { countryName } from '../data/countries';

const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed'];

interface Props {
  series: IndicatorSeries[];
}

interface ChartRow {
  date: string;
  [iso3: string]: number | null | string;
}

export function ComparisonChart({ series }: Props) {
  if (series.length === 0) {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={[]} />
      </ResponsiveContainer>
    );
  }

  // Build a date → values map so all series share the same x-axis
  const dateMap = new Map<string, ChartRow>();
  for (const s of series) {
    for (const p of s.points) {
      if (!dateMap.has(p.date)) dateMap.set(p.date, { date: p.date });
      const row = dateMap.get(p.date)!;
      row[s.countryiso3code] = p.value;
    }
  }
  const chartData = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData} margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey="date" style={{ fontSize: 12 }} />
        <YAxis style={{ fontSize: 12 }} width={70} />
        <Tooltip />
        <Legend formatter={(value: string) => countryName(value)} />
        {series.map((s, i) => (
          <Line
            key={s.countryiso3code}
            type="monotone"
            dataKey={s.countryiso3code}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={false}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
