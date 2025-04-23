import express from 'express';
import dotenv from 'dotenv';
import userStatsRouter from './routes/userStats.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();

app.use('/', userStatsRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});