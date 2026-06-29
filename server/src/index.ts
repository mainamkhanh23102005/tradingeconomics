import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { tradeRouter } from './routes/trade';
import { indicatorsRouter } from './routes/indicators';

const app = express();
const PORT = process.env.PORT ?? 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173';

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/trade', tradeRouter);
app.use('/api/indicators', indicatorsRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
