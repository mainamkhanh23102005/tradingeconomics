import { Router } from 'express';
import {
  getIndicators,
  getIndicatorsForComparison,
  WB_INDICATORS,
} from '../services/indicatorService';

export const indicatorsRouter = Router();

const ISO3_RE = /^[A-Z]{3}$/;

function validateIso3(raw: string): string | null {
  const upper = raw.toUpperCase();
  return ISO3_RE.test(upper) ? upper : null;
}

indicatorsRouter.get('/compare', async (req, res) => {
  const { countries, indicator, years } = req.query;

  if (typeof countries !== 'string' || typeof indicator !== 'string') {
    res.status(400).json({ error: 'countries and indicator query params are required' });
    return;
  }

  const iso3s = countries.split(',').map((c) => c.trim().toUpperCase());
  if (iso3s.some((iso3) => !ISO3_RE.test(iso3))) {
    res.status(400).json({ error: 'Invalid ISO3 country code in countries param' });
    return;
  }

  const validCodes = Object.keys(WB_INDICATORS);
  if (!validCodes.includes(indicator)) {
    res.status(400).json({ error: `Unknown indicator code: ${indicator}` });
    return;
  }

  const mrv = typeof years === 'string' ? parseInt(years, 10) : 20;

  try {
    const data = await getIndicatorsForComparison(iso3s, indicator, mrv);
    res.json(data);
  } catch {
    res.status(502).json({ error: 'Failed to fetch indicator data from upstream' });
  }
});

indicatorsRouter.get('/:iso3', async (req, res) => {
  const iso3 = validateIso3(req.params.iso3);
  if (!iso3) {
    res.status(400).json({ error: 'Invalid ISO3 country code — must be exactly 3 letters' });
    return;
  }

  try {
    const data = await getIndicators(iso3);
    res.json(data);
  } catch {
    res.status(502).json({ error: 'Failed to fetch indicator data from upstream' });
  }
});
