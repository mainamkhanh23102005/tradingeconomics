import request from 'supertest';
import express from 'express';
import { tradeRouter } from '../routes/trade';

const mockFetch = jest.fn();
global.fetch = mockFetch as typeof fetch;

const app = express();
app.use(express.json());
app.use('/api/trade', tradeRouter);

const fakeEntry = (direction: 'imports' | 'exports') => ({
  reporter: 'VNM',
  countries: 'China',
  continents: 'Asia',
  url: `https://example.com/${direction}/china`,
  value: 120000000,
  cat_name: 'Total',
  year: 2022,
});

const fakeOk = (direction: 'imports' | 'exports') =>
  Promise.resolve({
    ok: true,
    json: async () => [fakeEntry(direction)],
  });

describe('GET /api/trade/:iso3/:direction', () => {
  beforeEach(() => mockFetch.mockReset());

  it('returns 400 for invalid ISO3', async () => {
    const res = await request(app).get('/api/trade/INVALID/exports');
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 for direction other than imports/exports', async () => {
    mockFetch.mockImplementation(() => fakeOk('exports'));
    const res = await request(app).get('/api/trade/VNM/all');
    expect(res.status).toBe(400);
  });

  it('returns 200 with entries for valid imports request', async () => {
    mockFetch.mockImplementation(() => fakeOk('imports'));
    const res = await request(app).get('/api/trade/VNM/imports');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].countries).toBe('China');
  });

  it('returns 200 with entries for valid exports request', async () => {
    mockFetch.mockImplementation(() => fakeOk('exports'));
    const res = await request(app).get('/api/trade/VNM/exports');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('accepts lowercase iso3', async () => {
    mockFetch.mockImplementation(() => fakeOk('exports'));
    const res = await request(app).get('/api/trade/vnm/exports');
    expect(res.status).toBe(200);
  });

  it('returns 502 when upstream fails', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 503, statusText: 'Unavailable' });
    const res = await request(app).get('/api/trade/VNM/exports');
    expect(res.status).toBe(502);
  });
});

describe('GET /api/trade/:iso3/summary', () => {
  beforeEach(() => mockFetch.mockReset());

  it('returns both imports and exports in a single response', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => [fakeEntry('imports')] })
      .mockResolvedValueOnce({ ok: true, json: async () => [fakeEntry('exports')] });
    const res = await request(app).get('/api/trade/VNM/summary');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('imports');
    expect(res.body).toHaveProperty('exports');
    expect(Array.isArray(res.body.imports)).toBe(true);
    expect(Array.isArray(res.body.exports)).toBe(true);
  });

  it('returns 400 for invalid ISO3 on summary route', async () => {
    const res = await request(app).get('/api/trade/12/summary');
    expect(res.status).toBe(400);
  });

  it('returns 502 when upstream fails on summary', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, statusText: 'Error' });
    const res = await request(app).get('/api/trade/VNM/summary');
    expect(res.status).toBe(502);
  });
});
