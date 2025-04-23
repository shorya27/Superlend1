import express from 'express';
import { getUserSummary } from '../services/aaveService.js';

const router = express.Router();

router.get('/user-stats/:address', async (req, res) => {
  const userAddress = req.params.address;

  try {
    const summary = await getUserSummary(userAddress);

    const response = {
      totalSuppliedUSD: summary.totalSuppliedUSD,
      totalBorrowedUSD: summary.totalBorrowedUSD,
      healthFactor: summary.healthFactor,
      netAPY: `${summary.netAPY.toFixed(2)}%`,
    };

    res.json(response);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Failed to fetch user summary' });
  }
});

export default router;