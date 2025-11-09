import pool from '../config/database.js'

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Fetch basic user data
    const [users] = await pool.execute(
      `SELECT user_id, first_name, last_name, email, user_type, date_joined
       FROM user
       WHERE user_id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];

    // ✅ Compute points earned
    const [[earnedRow]] = await pool.execute(
      `SELECT COALESCE(SUM(points_earned), 0) AS earned
       FROM activity
       WHERE user_id = ?`,
      [userId]
    );

    // ✅ Compute points spent
    const [[spentRow]] = await pool.execute(
      `SELECT COALESCE(SUM(points_spent), 0) AS spent
       FROM redemption
       WHERE user_id = ?`,
      [userId]
    );

    const currentPoints = Number(earnedRow.earned) - Number(spentRow.spent);

    // Count activities
    const [[{ count: totalActivities }]] = await pool.execute(
      'SELECT COUNT(*) as count FROM activity WHERE user_id = ?',
      [userId]
    );

    // Count active goals (if user_goals exists)
    let activeGoals = 0;
    try {
      const [[{ count }]] = await pool.execute(
        'SELECT COUNT(*) as count FROM user_goals WHERE user_id = ? AND is_achieved = false',
        [userId]
      );
      activeGoals = count;
    } catch {
      activeGoals = 0; // table missing - ignore
    }

    const profileData = {
      userId: user.user_id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      userType: user.user_type,
      dateJoined: user.date_joined,
      totalPoints: currentPoints,   // ✅ FIXED POINTS
      stats: {
        totalActivities,
        activeGoals,
        carbonReduced: 0   // can compute later
      }
    };

    return res.json({ success: true, data: profileData });

  } catch (error) {
    console.error('❌ Profile fetch error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getUserPoints = async (req, res) => {
  const userId = req.user?.userId;

  try {
    // Total earned points
    const [[earnedRow]] = await pool.execute(
      `SELECT COALESCE(SUM(points_earned), 0) AS earned
       FROM activity
       WHERE user_id = ?`,
      [userId]
    );

    // Total spent points
    const [[spentRow]] = await pool.execute(
      `SELECT COALESCE(SUM(points_spent), 0) AS spent
       FROM redemption
       WHERE user_id = ?`,
      [userId]
    );

    const currentPoints = Number(earnedRow.earned) - Number(spentRow.spent);

    return res.json({ success: true, points: currentPoints });

  } catch (error) {
    console.error("❌ getUserPoints error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch points"
    });
  }
};
