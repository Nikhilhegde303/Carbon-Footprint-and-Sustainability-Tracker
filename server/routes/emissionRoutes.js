import express from 'express'
import { getEmissionFactors } from '../controllers/emissionController.js'
import { authenticateToken } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/', authenticateToken, getEmissionFactors)

export default router