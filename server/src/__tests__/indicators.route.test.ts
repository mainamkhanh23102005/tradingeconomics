import request from 'supertest';
import express from 'express';
import { indicatorsRouter } from '../routes/indicators';

const mockFetch = jest.fn();
global.fetch = mockFetch as typeof fetch;

const app = express();
app.use(express.json());
app.use('/api/indicators', indicatorsRouter);

const fakeSeriesResponse = () =>
  Promise.resolve({
    ok: true,
    json: async () => [
      { page: 1, pages: 1, per_page: 50, total: 1 },
      [
        {
          indicator: { id: 'NY.GDP.MKTP.CD', value: 'GDP (current US$)' },
          country: { id: 'VN', value: 'Viet Nam' },
          countryiso3code: 'VNM',
          date: '2023',
          value: 476388230307.175,
        },
      ],
    ],
  });

describe('GET /api/indicators/:iso3', () => {
  beforeEach(() => mockFetch.mockReset());

  it('returns 400 for ISO3 shorter than 3 characters', async () => {
    const res = await request(app).get('/api/indicators/VN');
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 for ISO3 longer than 3 characters', async () => {
    const res = await request(app).get('/api/indicators/VNMX');
    expect(res.status).toBe(400);
  });

  it('returns 400 for ISO3 containing digits', async () => {
    const res = await request(app).get('/api/indicators/V1M');
    expect(res.status).toBe(400);
  });

  it('accepts lowercase iso3 and normalises it', async () => {
    mockFetch.mockImplementation(fakeSeriesResponse);
    const res = await request(app).get('/api/indicators/vnm');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(6);
  });

  it('returns 200 with 6 indicator series for valid uppercase ISO3', async () => {
    mockFetch.mockImplementation(fakeSeriesResponse);
    const res = await request(app).get('/api/indicators/VNM');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(6);
    expect(res.body[0]).toHaveProperty('code');
    expect(res.body[0]).toHaveProperty('label');
    expect(res.body[0]).toHaveProperty('points');
  });

  it('returns 502 when upstream WB fetch fails', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error' });
    const res = await request(app).get('/api/indicators/VNM');
    expect(res.status).toBe(502);
    expect(res.body.error).toBeDefined();
  });
});

describe('GET /api/indicators/compare', () => {
  beforeEach(() => mockFetch.mockReset());

  it('returns 400 when countries param is missing', async () => {
    const res = await request(app).get('/api/indicators/compare?indicator=NY.GDP.MKTP.CD');
    expect(res.status).toBe(400);
  });

  it('returns 400 when indicator param is missing', async () => {
    const res = await request(app).get('/api/indicators/compare?countries=VNM,THA');
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid indicator code', async () => {
    const res = await request(app).get('/api/indicators/compare?countries=VNM&indicator=FAKE.CODE');
    expect(res.status).toBe(400);
  });

  it('returns 400 when one country code is invalid', async () => {
    const res = await request(app).get(
      '/api/indicators/compare?countries=VNM,INVALID&indicator=NY.GDP.MKTP.CD',
    );
    expect(res.status).toBe(400);
  });

  it('returns 200 with per-country series for valid request', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [
        { page: 1, pages: 1, per_page: 50, total: 2 },
        [
          { indicator: { id: 'NY.GDP.MKTP.CD', value: 'GDP' }, country: { id: 'VN', value: 'Viet Nam' }, countryiso3code: 'VNM', date: '2023', value: 476e9 },
          { indicator: { id: 'NY.GDP.MKTP.CD', value: 'GDP' }, country: { id: 'TH', value: 'Thailand' }, countryiso3code: 'THA', date: '2023', value: 512e9 },
        ],
      ],
    });
    const res = await request(app).get(
      '/api/indicators/compare?countries=VNM,THA&indicator=NY.GDP.MKTP.CD',
    );
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('returns 502 when upstream fails', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 503, statusText: 'Unavailable' });
    const res = await request(app).get(
      '/api/indicators/compare?countries=VNM&indicator=NY.GDP.MKTP.CD',
    );
    expect(res.status).toBe(502);
  });
});
