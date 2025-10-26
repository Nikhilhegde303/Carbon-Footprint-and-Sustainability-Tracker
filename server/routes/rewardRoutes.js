import express from 'express'
import { getRewards, redeemReward, getRedemptionHistory } from '../controllers/rewardController.js'
import { authenticateToken } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/', authenticateToken, getRewards)
router.get('/history', authenticateToken, getRedemptionHistory)
router.post('/redeem', authenticateToken, redeemReward)

export default router