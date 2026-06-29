import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TradeTreemap } from '../components/TradeTreemap';
import type { ComtradeEntry } from '../api/client';

vi.mock('recharts', () => ({
  Treemap: ({
    data,
    content,
  }: {
    data: Array<{ name: string; size: number; iso3: string }>;
    content: React.ComponentType<{ name: string; size: number; width: number; height: number; iso3: string }>;
  }) => {
    const ContentComponent = content;
    return (
      <div data-testid="treemap">
        {data.map((d) => (
          <ContentComponent key={d.name} name={d.name} size={d.size} width={120} height={60} iso3={d.iso3} />
        ))}
      </div>
    );
  },
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="treemap-container">{children}</div>
  ),
}));

const makeEntry = (countries: string, value: number, continents = 'Asia'): ComtradeEntry => ({
  reporter: 'VNM',
  countries,
  continents,
  url: `https://example.com/${countries.toLowerCase()}`,
  value,
  cat_name: 'Total',
  year: 2022,
});

describe('TradeTreemap', () => {
  it('renders a cell for each trade partner', () => {
    const data = [
      makeEntry('China', 100e9),
      makeEntry('United States', 60e9, 'Americas'),
    ];
    render(<TradeTreemap data={data} onCountryClick={vi.fn()} />);
    expect(screen.getByText('China')).toBeInTheDocument();
    expect(screen.getByText('United States')).toBeInTheDocument();
  });

  it('calls onCountryClick when a partner cell is clicked', async () => {
    const user = userEvent.setup();
    const onCountryClick = vi.fn();
    const data = [makeEntry('China', 100e9)];
    render(<TradeTreemap data={data} onCountryClick={onCountryClick} />);
    await user.click(screen.getByText('China'));
    expect(onCountryClick).toHaveBeenCalledWith(expect.any(String));
  });

  it('renders the treemap container', () => {
    render(<TradeTreemap data={[makeEntry('China', 100e9)]} onCountryClick={vi.fn()} />);
    expect(screen.getByTestId('treemap-container')).toBeInTheDocument();
  });
});
