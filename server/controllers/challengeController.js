import db from "../config/database.js";

// Helper – normalize user id property (your Dashboard uses req.user.userId)
const getReqUserId = (req) => req.user?.userId ?? req.user?.user_id;

export const listChallengesForUser = async (req, res) => {
  const userId = getReqUserId(req);
  try {
    // My challenges
    const [mine] = await db.query(
      `SELECT c.challenge_id, c.challenge_name, c.description, c.category,
              c.reward_points, c.start_date, c.end_date,
              (SELECT COUNT(*) FROM user_challenges uc WHERE uc.challenge_id = c.challenge_id) AS participants
       FROM challenges c
       INNER JOIN user_challenges uc ON uc.challenge_id = c.challenge_id
       WHERE uc.user_id = ? AND c.is_active = 1
       ORDER BY c.start_date DESC`,
      [userId]
    );

    // Available (not joined)
    const [available] = await db.query(
      `SELECT c.challenge_id, c.challenge_name, c.description, c.category,
              c.reward_points, c.start_date, c.end_date,
              (SELECT COUNT(*) FROM user_challenges uc WHERE uc.challenge_id = c.challenge_id) AS participants
       FROM challenges c
       WHERE c.is_active = 1
         AND c.challenge_id NOT IN (
             SELECT challenge_id FROM user_challenges WHERE user_id = ?
         )
       ORDER BY c.start_date DESC`,
      [userId]
    );

    return res.status(200).json({ available, mine });
  } catch (e) {
    console.error("Error listChallengesForUser:", e);
    return res.status(500).json({ message: "Failed to load challenges" });
  }
};

export const joinChallenge = async (req, res) => {
  const userId = getReqUserId(req);
  const { challenge_id } = req.body;

  if (!challenge_id) return res.status(400).json({ message: "challenge_id is required" });

  try {
    await db.query(
      "INSERT INTO user_challenges (user_id, challenge_id) VALUES (?, ?)",
      [userId, challenge_id]
    );
    await db.query(
      "UPDATE challenges SET participant_count = participant_count + 1 WHERE challenge_id = ?",
      [challenge_id]
    );
    return res.status(200).json({ message: "Joined challenge" });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "You already joined this challenge" });
    }
    console.error("joinChallenge error:", e);
    return res.status(500).json({ message: "Failed to join challenge" });
  }
};

export const leaveChallenge = async (req, res) => {
  const userId = getReqUserId(req);
  const { challenge_id } = req.params;

  if (!challenge_id) return res.status(400).json({ message: "challenge_id is required" });

  try {
    const [result] = await db.query(
      "DELETE FROM user_challenges WHERE user_id = ? AND challenge_id = ?",
      [userId, challenge_id]
    );

    // Only decrement if a row was removed
    if (result.affectedRows > 0) {
      await db.query(
        "UPDATE challenges SET participant_count = GREATEST(participant_count - 1, 0) WHERE challenge_id = ?",
        [challenge_id]
      );
    }

    return res.status(200).json({ message: "Left challenge" });
  } catch (e) {
    console.error("leaveChallenge error:", e);
    return res.status(500).json({ message: "Failed to leave challenge" });
  }
};
