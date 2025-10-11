import express from 'express';
import { addActivity, getActivities } from '../controllers/activityController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authenticateToken, addActivity);
router.get('/', authenticateToken, getActivities);

export default router;