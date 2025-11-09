import pool from '../config/database.js';

export const updateChallengeProgress = async (userId) => {
  try {
    console.log('🔄 Updating challenge progress for user:', userId);

    // Get user's active challenges
    const [userChallenges] = await pool.execute(`
      SELECT uc.challenge_id, c.target_reduction
      FROM user_challenges uc
      INNER JOIN challenges c ON uc.challenge_id = c.challenge_id
      WHERE uc.user_id = ? AND uc.is_completed = false AND c.end_date >= CURDATE()
    `, [userId]);

    for (const challenge of userChallenges) {
      // Calculate total emission from activities since joining challenge
      const [progress] = await pool.execute(`
        SELECT COALESCE(SUM(a.calculated_emission), 0) as total_emission
        FROM activity a
        INNER JOIN user_challenges uc ON a.user_id = uc.user_id
        WHERE a.user_id = ? 
        AND uc.challenge_id = ?
        AND a.activity_date >= uc.joined_at
        AND a.activity_date <= CURDATE()
      `, [userId, challenge.challenge_id]);

      const totalEmission = progress[0].total_emission;
      const isCompleted = totalEmission >= challenge.target_reduction;

      // Update progress
      await pool.execute(`
        UPDATE user_challenges 
        SET progress_emission = ?, 
            is_completed = ?,
            completed_at = CASE WHEN ? AND completed_at IS NULL THEN NOW() ELSE completed_at END
        WHERE user_id = ? AND challenge_id = ?
      `, [totalEmission, isCompleted, isCompleted, userId, challenge.challenge_id]);

      // If completed, reward points
      if (isCompleted) {
        const [challengeData] = await pool.execute(
          'SELECT reward_points FROM challenges WHERE challenge_id = ?',
          [challenge.challenge_id]
        );

        if (challengeData.length > 0) {
          await pool.execute(
            'UPDATE user SET total_points = total_points + ? WHERE user_id = ?',
            [challengeData[0].reward_points, userId]
          );
          console.log(`🎉 Rewarded ${challengeData[0].reward_points} points for completing challenge`);
        }
      }
    }

    console.log('✅ Challenge progress updated');

  } catch (error) {
    console.error('❌ Update challenge progress error:', error);
    throw error; // Re-throw to handle in caller
  }
};