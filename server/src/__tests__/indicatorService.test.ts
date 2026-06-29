import { parseWbResponse, getIndicators, getIndicatorsForComparison, WB_INDICATORS } from '../services/indicatorService';

const mockFetch = jest.fn();
global.fetch = mockFetch as typeof fetch;

const makeWbItem = (code: string, iso3: string, date: string, value: number | null) => ({
  indicator: { id: code, value: 'Test Indicator' },
  country: { id: 'VN', value: 'Viet Nam' },
  countryiso3code: iso3,
  date,
  value,
});

const makePage = (items: ReturnType<typeof makeWbItem>[]) =>
  [{ page: 1, pages: 1, per_page: 50, total: items.length }, items] as const;

describe('WB_INDICATORS', () => {
  it('exports exactly 6 verified indicator codes', () => {
    const codes = Object.keys(WB_INDICATORS);
    expect(codes).toHaveLength(6);
    expect(codes).toContain('NY.GDP.MKTP.CD');
    expect(codes).toContain('FP.CPI.TOTL.ZG');
    expect(codes).toContain('SL.UEM.TOTL.ZS');
    expect(codes).toContain('BN.CAB.XOKA.GD.ZS');
    expect(codes).toContain('NE.TRD.GNFS.ZS');
    expect(codes).toContain('BX.KLT.DINV.WD.GD.ZS');
  });
});

describe('parseWbResponse', () => {
  it('extracts data array from WB tuple', () => {
    const raw = makePage([makeWbItem('NY.GDP.MKTP.CD', 'VNM', '2023', 476e9)]);
    const items = parseWbResponse(raw);
    expect(items).toHaveLength(1);
    expect(items[0].value).toBe(476e9);
    expect(items[0].date).toBe('2023');
  });

  it('preserves null values without converting them', () => {
    const raw = makePage([makeWbItem('NY.GDP.MKTP.CD', 'VNM', '2020', null)]);
    const items = parseWbResponse(raw);
    expect(items[0].value).toBeNull();
  });

  it('returns empty array when data array is empty', () => {
    const raw = makePage([]);
    expect(parseWbResponse(raw)).toHaveLength(0);
  });
});

describe('getIndicators', () => {
  beforeEach(() => mockFetch.mockReset());

  const mockOkResponse = (code: string) => ({
    ok: true,
    json: async () => makePage([makeWbItem(code, 'VNM', '2023', 100)]),
  });

  it('fetches all 6 indicator series and returns them shaped', async () => {
    mockFetch.mockImplementation((_url: string) => {
      const code = Object.keys(WB_INDICATORS)[mockFetch.mock.calls.length - 1];
      return Promise.resolve(mockOkResponse(code ?? 'NY.GDP.MKTP.CD'));
    });

    const result = await getIndicators('VNM');
    expect(result).toHaveLength(6);
    expect(mockFetch).toHaveBeenCalledTimes(6);
    expect(result[0].countryiso3code).toBe('VNM');
    expect(result[0].points[0].value).toBe(100);
  });

  it('uppercases the countryiso3code regardless of input case', async () => {
    mockFetch.mockResolvedValue(mockOkResponse('NY.GDP.MKTP.CD'));
    const result = await getIndicators('vnm');
    expect(result[0].countryiso3code).toBe('VNM');
  });

  it('throws when upstream returns non-ok status', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 503, statusText: 'Unavailable' });
    await expect(getIndicators('VNM')).rejects.toThrow('503');
  });

  it('maps null WB values through without coercing them', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => makePage([makeWbItem('NY.GDP.MKTP.CD', 'VNM', '2020', null)]),
    });
    const result = await getIndicators('VNM');
    expect(result[0].points[0].value).toBeNull();
  });
});

describe('getIndicatorsForComparison', () => {
  beforeEach(() => mockFetch.mockReset());

  it('groups results by country and returns one series per country', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () =>
        makePage([
          makeWbItem('NY.GDP.MKTP.CD', 'VNM', '2023', 476e9),
          makeWbItem('NY.GDP.MKTP.CD', 'THA', '2023', 512e9),
        ]),
    });

    const result = await getIndicatorsForComparison(['VNM', 'THA'], 'NY.GDP.MKTP.CD');
    expect(result).toHaveLength(2);
    const vnm = result.find((s) => s.countryiso3code === 'VNM');
    const tha = result.find((s) => s.countryiso3code === 'THA');
    expect(vnm).toBeDefined();
    expect(tha).toBeDefined();
    expect(vnm!.points[0].value).toBe(476e9);
  });

  it('sends countries as semicolon-delimited path in the URL', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => makePage([]),
    });
    await getIndicatorsForComparison(['VNM', 'THA', 'USA'], 'NY.GDP.MKTP.CD');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('VNM;THA;USA'),
    );
  });

  it('throws on upstream error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 502, statusText: 'Bad Gateway' });
    await expect(
      getIndicatorsForComparison(['VNM'], 'NY.GDP.MKTP.CD'),
    ).rejects.toThrow('502');
  });
});
