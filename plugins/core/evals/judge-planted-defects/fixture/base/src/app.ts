import express from 'express';
import { requireApiKey } from './middleware/auth.js';
import { ordersRouter } from './routes/orders.js';

export const app = express();
app.use(express.json());
app.use('/orders', requireApiKey, ordersRouter);

if (process.env.NODE_ENV !== 'test') {
  app.listen(Number(process.env.PORT ?? 3000));
}
