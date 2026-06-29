import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComparisonChart } from '../components/ComparisonChart';
import type { IndicatorSeries } from '../api/client';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="chart-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => <svg data-testid="line-chart">{children}</svg>,
  Line: ({ dataKey }: { dataKey: string }) => <g data-testid={`line-${dataKey}`} />,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Legend: () => null,
  CartesianGrid: () => null,
}));

const makeSeries = (iso3: string, points: Array<{ date: string; value: number | null }>): IndicatorSeries => ({
  code: 'NY.GDP.MKTP.CD',
  label: 'GDP (current US$)',
  countryiso3code: iso3,
  points,
});

describe('ComparisonChart', () => {
  it('renders one Line per country series', () => {
    const series = [
      makeSeries('VNM', [{ date: '2023', value: 476e9 }]),
      makeSeries('THA', [{ date: '2023', value: 512e9 }]),
    ];
    render(<ComparisonChart series={series} />);
    expect(screen.getByTestId('line-VNM')).toBeInTheDocument();
    expect(screen.getByTestId('line-THA')).toBeInTheDocument();
  });

  it('renders the chart container', () => {
    render(<ComparisonChart series={[makeSeries('VNM', [{ date: '2023', value: 100 }])]} />);
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('renders nothing meaningful when series is empty', () => {
    render(<ComparisonChart series={[]} />);
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });
});
