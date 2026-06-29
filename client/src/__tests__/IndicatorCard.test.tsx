import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IndicatorCard } from '../components/IndicatorCard';
import type { IndicatorSeries } from '../api/client';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sparkline-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => <svg>{children}</svg>,
  Line: () => null,
}));

const makeSeries = (code: string, points: Array<{ date: string; value: number | null }>): IndicatorSeries => ({
  code,
  label: 'GDP (current US$)',
  countryiso3code: 'VNM',
  points,
});

describe('IndicatorCard', () => {
  it('renders the indicator label', () => {
    render(<IndicatorCard series={makeSeries('NY.GDP.MKTP.CD', [{ date: '2023', value: 476e9 }])} />);
    expect(screen.getByText('GDP (current US$)')).toBeInTheDocument();
  });

  it('renders "N/A" when the most recent value is null', () => {
    render(<IndicatorCard series={makeSeries('NY.GDP.MKTP.CD', [{ date: '2023', value: null }])} />);
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('renders "N/A" when points array is empty', () => {
    render(<IndicatorCard series={makeSeries('NY.GDP.MKTP.CD', [])} />);
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('formats GDP as dollars with B/T suffix', () => {
    render(<IndicatorCard series={makeSeries('NY.GDP.MKTP.CD', [{ date: '2023', value: 476e9 }])} />);
    expect(screen.getByText(/\$476\.0B/)).toBeInTheDocument();
  });

  it('formats percentage indicators with % symbol', () => {
    render(<IndicatorCard series={makeSeries('FP.CPI.TOTL.ZG', [{ date: '2023', value: 3.62 }])} />);
    expect(screen.getByText(/3\.62%/)).toBeInTheDocument();
  });

  it('shows the data year of the most recent non-null value', () => {
    render(
      <IndicatorCard
        series={makeSeries('FP.CPI.TOTL.ZG', [
          { date: '2024', value: null },
          { date: '2023', value: 3.62 },
        ])}
      />,
    );
    expect(screen.getByText('2023')).toBeInTheDocument();
  });

  it('renders the sparkline container', () => {
    render(<IndicatorCard series={makeSeries('NY.GDP.MKTP.CD', [{ date: '2023', value: 100 }])} />);
    expect(screen.getByTestId('sparkline-container')).toBeInTheDocument();
  });
});
