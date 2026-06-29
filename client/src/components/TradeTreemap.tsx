import { useMemo } from 'react';
import { Treemap, ResponsiveContainer } from 'recharts';
import type { ComtradeEntry } from '../api/client';
import { COUNTRIES } from '../data/countries';

const CONTINENT_COLORS: Record<string, string> = {
  Africa: '#f59e0b',
  Americas: '#10b981',
  Asia: '#3b82f6',
  Europe: '#8b5cf6',
  Oceania: '#06b6d4',
  Unknown: '#9ca3af',
};

function continentColor(continent: string | undefined): string {
  return CONTINENT_COLORS[continent ?? 'Unknown'] ?? '#9ca3af';
}

function entryToIso3(entry: ComtradeEntry): string {
  const match = COUNTRIES.find(
    (c) => c.name.toLowerCase() === entry.countries.toLowerCase(),
  );
  return match?.iso3 ?? '';
}

interface CellProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  fill?: string;
  iso3?: string;
  onClick?: () => void;
}

function CellContent({ x = 0, y = 0, width = 0, height = 0, name = '', fill = '#9ca3af', onClick }: CellProps) {
  if (width < 10 || height < 10) return null;
  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      <rect x={x} y={y} width={width} height={height} fill={fill} stroke="#fff" strokeWidth={2} rx={3} />
      {height > 28 && width > 40 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          fontSize={Math.min(13, Math.max(9, width / 9))}
          fontWeight={600}
        >
          {name}
        </text>
      )}
    </g>
  );
}

interface TreemapNode {
  name: string;
  size: number;
  fill: string;
  iso3: string;
  [key: string]: unknown;
}

interface Props {
  data: ComtradeEntry[];
  onCountryClick: (iso3: string) => void;
}

export function TradeTreemap({ data, onCountryClick }: Props) {
  const nodes: TreemapNode[] = data
    .filter((e) => e.value > 0)
    .map((e) => ({
      name: e.countries,
      size: e.value,
      fill: continentColor(e.continents),
      iso3: entryToIso3(e),
    }));

  // Stable renderer — memoized so React doesn't treat it as a new component type each render
  const CellRenderer = useMemo(
    () =>
      function CellRenderer(props: CellProps) {
        return (
          <CellContent
            {...props}
            onClick={() => {
              if (props.iso3) onCountryClick(props.iso3);
            }}
          />
        );
      },
    [onCountryClick],
  );

  return (
    <ResponsiveContainer width="100%" height={480}>
      <Treemap
        data={nodes}
        dataKey="size"
        aspectRatio={4 / 3}
        content={CellRenderer}
      />
    </ResponsiveContainer>
  );
}
