import { useState, useMemo, useRef } from 'react';
import { COUNTRIES, findCountry } from '../data/countries';

interface Props {
  value: string;
  onChange: (iso3: string) => void;
  label?: string;
}

export function CountrySelector({ value, onChange, label = 'Country' }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return COUNTRIES.slice(0, 30);
    const lower = query.toLowerCase();
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.iso3.toLowerCase().includes(lower),
    ).slice(0, 30);
  }, [query]);

  const selected = findCountry(value);

  function handleFocus() {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    setOpen(true);
    setQuery('');
    setActiveIndex(0);
  }

  function handleBlur() {
    blurTimer.current = setTimeout(() => setOpen(false), 150);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setActiveIndex(0);
    setOpen(true);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      const country = filtered[activeIndex];
      if (country) {
        onChange(country.iso3);
        setOpen(false);
        setQuery('');
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  }

  function handleSelect(iso3: string) {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    onChange(iso3);
    setOpen(false);
    setQuery('');
  }

  const displayValue = open ? query : (selected?.name ?? value);

  return (
    <div className="country-selector" style={{ position: 'relative', display: 'inline-block' }}>
      <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>{label}</label>
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Search country…"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-haspopup="listbox"
        style={{ width: 240, padding: '6px 10px', fontSize: 14 }}
      />
      {open && filtered.length > 0 && (
        <ul
          role="listbox"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid #ccc',
            borderTop: 'none',
            maxHeight: 240,
            overflowY: 'auto',
            margin: 0,
            padding: 0,
            listStyle: 'none',
            zIndex: 100,
          }}
        >
          {filtered.map((country, i) => (
            <li
              key={country.iso3}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={() => handleSelect(country.iso3)}
              style={{
                padding: '6px 10px',
                cursor: 'pointer',
                background: i === activeIndex ? '#2563eb' : '#fff',
                color: i === activeIndex ? '#fff' : '#111',
                fontSize: 14,
              }}
            >
              {country.name} ({country.iso3})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
