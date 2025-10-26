import express from 'express'
import { getActivities, addActivity } from '../controllers/activityController.js'
import { authenticateToken } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/', authenticateToken, getActivities)
router.post('/', authenticateToken, addActivity)

export default router