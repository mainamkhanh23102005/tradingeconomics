import { Router } from 'express';
import { getTradeByCountry, getTradeSummary } from '../services/comtradeService';

export const tradeRouter = Router();

const ISO3_RE = /^[A-Z]{3}$/;
const VALID_DIRECTIONS = new Set(['imports', 'exports']);

function validateIso3(raw: string): string | null {
  const lower = raw.toLowerCase();
  return ISO3_RE.test(raw.toUpperCase()) ? lower : null;
}

tradeRouter.get('/:iso3/summary', async (req, res) => {
  const code = validateIso3(req.params.iso3);
  if (!code) {
    res.status(400).json({ error: 'Invalid ISO3 country code — must be exactly 3 letters' });
    return;
  }

  try {
    const data = await getTradeSummary(code);
    res.json(data);
  } catch {
    res.status(502).json({ error: 'Failed to fetch trade data from upstream' });
  }
});

tradeRouter.get('/:iso3/:direction', async (req, res) => {
  const code = validateIso3(req.params.iso3);
  if (!code) {
    res.status(400).json({ error: 'Invalid ISO3 country code — must be exactly 3 letters' });
    return;
  }

  const { direction } = req.params;
  if (!VALID_DIRECTIONS.has(direction)) {
    res.status(400).json({ error: 'direction must be "imports" or "exports"' });
    return;
  }

  try {
    const data = await getTradeByCountry(code, direction as 'imports' | 'exports');
    res.json(data);
  } catch {
    res.status(502).json({ error: 'Failed to fetch trade data from upstream' });
  }
});
