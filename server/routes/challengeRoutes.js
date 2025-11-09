import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
  listChallengesForUser,   // GET /api/challenges  → { available:[], mine:[] }
  joinChallenge,           // POST /api/challenges/join
  leaveChallenge           // DELETE /api/challenges/join/:challenge_id
} from "../controllers/challengeController.js";

const router = express.Router();

router.get("/", verifyToken, listChallengesForUser);
router.post("/join", verifyToken, joinChallenge);
router.delete("/join/:challenge_id", verifyToken, leaveChallenge);

export default router;
