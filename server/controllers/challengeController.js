import pool from '../config/database.js';

// Get all active challenges with participant count - FIXED: challenges table name
const getChallenges = async (req, res) => {
  try {
    const [challenges] = await pool.execute(`
      SELECT 
        cc.*,
        u.first_name as creator_name,
        COUNT(uc.user_id) as participant_count,
        EXISTS(
          SELECT 1 FROM user_challenges 
          WHERE user_id = ? AND challenge_id = cc.challenge_id
        ) as user_joined
      FROM challenges cc
      LEFT JOIN user u ON cc.created_by_user_id = u.user_id
      LEFT JOIN user_challenges uc ON cc.challenge_id = uc.challenge_id
      WHERE cc.is_active = true
      GROUP BY cc.challenge_id
      ORDER BY cc.start_date DESC
    `, [req.user.userId]);

    res.json({ success: true, data: challenges });
  } catch (error) {
    console.error('Get challenges error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching challenges' });
  }
};

// Join a challenge
const joinChallenge = async (req, res) => {
  const { challenge_id } = req.body;
  
  try {
    // Check if already joined using EXISTS
    const [existing] = await pool.execute(
      `SELECT EXISTS(
        SELECT 1 FROM user_challenges 
        WHERE user_id = ? AND challenge_id = ?
      ) as already_joined`,
      [req.user.userId, challenge_id]
    );

    if (existing[0].already_joined) {
      return res.status(400).json({ success: false, message: 'Already joined this challenge' });
    }

    // Start transaction
    await pool.execute('START TRANSACTION');

    // Add user to challenge
    await pool.execute(
      'INSERT INTO user_challenges (user_id, challenge_id, joined_at) VALUES (?, ?, NOW())',
      [req.user.userId, challenge_id]
    );

    // Update participant count using subquery
    await pool.execute(`
      UPDATE challenges 
      SET participant_count = (
        SELECT COUNT(*) FROM user_challenges WHERE challenge_id = ?
      )
      WHERE challenge_id = ?
    `, [challenge_id, challenge_id]);

    await pool.execute('COMMIT');
    
    res.json({ success: true, message: 'Successfully joined challenge' });
  } catch (error) {
    await pool.execute('ROLLBACK');
    console.error('Join challenge error:', error);
    res.status(500).json({ success: false, message: 'Error joining challenge' });
  }
};

// Get user's joined challenges with progress - FIXED: challenges table name
const getUserChallenges = async (req, res) => {
  try {
    const [challenges] = await pool.execute(`
      SELECT 
        cc.challenge_id,
        cc.challenge_name,
        cc.description,
        cc.target_reduction,
        cc.reward_points,
        uc.joined_at,
        COALESCE(SUM(a.calculated_emission), 0) as total_emission_saved,
        (cc.target_reduction - COALESCE(SUM(a.calculated_emission), 0)) as remaining_target
      FROM user_challenges uc
      INNER JOIN challenges cc ON uc.challenge_id = cc.challenge_id
      LEFT JOIN activity a ON uc.user_id = a.user_id 
        AND a.activity_date BETWEEN cc.start_date AND cc.end_date
      WHERE uc.user_id = ? AND cc.is_active = true
      GROUP BY cc.challenge_id, uc.joined_at
      HAVING total_emission_saved < cc.target_reduction
    `, [req.user.userId]);

    res.json({ success: true, data: challenges });
  } catch (error) {
    console.error('Get user challenges error:', error);
    res.status(500).json({ success: false, message: 'Error fetching user challenges' });
  }
};

export { getChallenges, joinChallenge, getUserChallenges };