import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
  getRewards,
  redeemReward,
  getRedemptionHistory
} from '../controllers/rewardController.js';

const router = express.Router();

// Public/Protected routes
router.get('/', authenticateToken, getRewards);
router.post('/redeem', authenticateToken, redeemReward);
router.get('/history', authenticateToken, getRedemptionHistory);

export default router;
