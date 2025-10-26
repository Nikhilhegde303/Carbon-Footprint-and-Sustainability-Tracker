import pool from '../config/database.js';

export const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get basic user stats
    const [userStats] = await pool.execute(`
      SELECT 
        u.total_points,
        u.date_joined,
        COUNT(a.activity_id) as total_activities,
        COALESCE(SUM(a.calculated_emission), 0) as total_emission_saved,
        COALESCE(SUM(a.points_earned), 0) as total_points_earned,
        (SELECT COUNT(*) FROM user_challenges WHERE user_id = u.user_id) as joined_challenges_count
      FROM user u
      LEFT JOIN activity a ON u.user_id = a.user_id
      WHERE u.user_id = ?
      GROUP BY u.user_id
    `, [userId]);

    // Get recent activities
    const [recentActivities] = await pool.execute(`
      SELECT 
        a.activity_id,
        a.activity_date,
        a.calculated_emission,
        a.points_earned,
        ef.activity_name,
        ef.category
      FROM activity a
      INNER JOIN emission_factor ef ON a.factor_id = ef.factor_id
      WHERE a.user_id = ?
      ORDER BY a.activity_date DESC, a.created_at DESC
      LIMIT 5
    `, [userId]);

    const dashboardData = {
      ...userStats[0],
      recentActivities,
      joined_challenges_count: userStats[0]?.joined_challenges_count || 0
    };

    console.log('📊 Sending dashboard data:', dashboardData);
    
    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching dashboard data' 
    });
  }
};