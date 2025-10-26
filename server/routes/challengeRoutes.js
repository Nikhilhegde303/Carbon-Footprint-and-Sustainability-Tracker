import express from 'express'
import { getChallenges, joinChallenge, getUserChallenges } from '../controllers/challengeController.js'
import { authenticateToken } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/', authenticateToken, getChallenges)
router.get('/user', authenticateToken, getUserChallenges)
router.post('/join', authenticateToken, joinChallenge)

export default router