import pool from '../config/database.js'

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId

    // Get user profile with additional stats - Use exact column names
    const [users] = await pool.execute(
      `SELECT user_id, first_name, last_name, email, user_type, total_points, date_joined 
       FROM user WHERE user_id = ?`,
      [userId]
    )

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    const user = users[0]

    // Get recent activities count
    const [activityCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM activity WHERE user_id = ?',
      [userId]
    )

    // Get goals count
    const [goalCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM user_goals WHERE user_id = ? AND is_achieved = false',
      [userId]
    )

    const profileData = {
      userId: user.user_id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      userType: user.user_type,
      totalPoints: user.total_points,
      dateJoined: user.date_joined,
      stats: {
        totalActivities: activityCount[0].count,
        activeGoals: goalCount[0].count,
        carbonReduced: 0
      }
    }

    res.json({
      success: true,
      data: profileData
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}