// server/routes/newsRoutes.js
import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { getSustainabilityNews } from '../controllers/newsController.js';

const router = express.Router();

// Keep it auth-protected to match the rest of your app
router.get('/', authenticateToken, getSustainabilityNews);

export default router;
