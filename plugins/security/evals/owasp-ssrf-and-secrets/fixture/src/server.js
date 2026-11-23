import express from 'express';
import { config } from './config.js';
import { adminRouter } from './routes/admin.js';
import { billingRouter } from './routes/billing.js';
import { linksRouter } from './routes/links.js';
import { previewRouter } from './routes/preview.js';

const app = express();
app.use(express.json());
app.use(previewRouter);
app.use(billingRouter);
app.use(adminRouter);
app.use(linksRouter);

app.listen(config.port, () => console.log(`linkcard-api on :${config.port}`));
