// server/controllers/dashboardController.js
import pool from '../config/database.js';

export const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('📊 Fetching dashboard data for user:', userId);

    // 1)user basic stats 
    const [userStats] = await pool.execute(
      `
      SELECT 
        u.user_id,
        u.first_name,
        u.last_name,
        u.total_points,
        u.date_joined,
        COUNT(a.activity_id) as total_activities,
        COALESCE(SUM(a.calculated_emission), 0) as total_emission,
        COALESCE(SUM(a.points_earned), 0) as total_points_earned
      FROM user u
      LEFT JOIN activity a ON u.user_id = a.user_id
      WHERE u.user_id = ?
      GROUP BY u.user_id, u.first_name, u.last_name, u.total_points, u.date_joined
      `,
      [userId]
    );

    if (!userStats || userStats.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 2) Recent activities (if no activity rows, return empty)
    const [recentActivities] = await pool.execute(
      `
      SELECT 
        a.activity_id,
        a.activity_date,
        a.consumption_value,
        a.calculated_emission,
        a.points_earned,
        ef.activity_name,
        ef.category,
        ef.unit
      FROM activity a
      INNER JOIN emission_factor ef ON a.factor_id = ef.factor_id
      WHERE a.user_id = ?
      ORDER BY a.activity_date DESC, a.created_at DESC
      LIMIT 5
      `,
      [userId]
    );

    // 3) Category breakdown
    const [categoryBreakdown] = await pool.execute(
      `
      SELECT 
        ef.category,
        COUNT(a.activity_id) as activity_count,
        COALESCE(SUM(a.calculated_emission), 0) as total_emission,
        COALESCE(SUM(a.points_earned), 0) as total_points
      FROM activity a
      INNER JOIN emission_factor ef ON a.factor_id = ef.factor_id
      WHERE a.user_id = ?
      GROUP BY ef.category
      `,
      [userId]
    );

    // 4) joined_challenges_count — this used to be a subquery referencing user_challenges.
    let joinedChallengesCount = 0;
    try {
      const [rows] = await pool.execute(
        `SELECT COUNT(*) as cnt FROM user_challenges WHERE user_id = ?`,
        [userId]
      );
      if (rows && rows.length > 0) joinedChallengesCount = rows[0].cnt || 0;
    } catch (err) {
      // Table probably doesn't exist — log and continue with default 0.
      console.warn('⚠️ user_challenges table not found or query failed. Defaulting joined_challenges_count to 0.', err.message);
      joinedChallengesCount = 0;
    }

    const userRow = userStats[0];

    const dashboardData = {
      user: {
        first_name: userRow.first_name,
        last_name: userRow.last_name,
        total_points: userRow.total_points,
        date_joined: userRow.date_joined
      },
      stats: {
        total_activities: parseInt(userRow.total_activities, 10) || 0,
        total_emission: parseFloat(userRow.total_emission || 0).toFixed(2),
        total_points_earned: parseInt(userRow.total_points_earned, 10) || 0,
        joined_challenges_count: parseInt(joinedChallengesCount, 10) || 0
      },
      recent_activities: recentActivities || [],
      category_breakdown: categoryBreakdown || []
    };

    console.log('📈 Dashboard data prepared:', {
      activities: (recentActivities || []).length,
      totalPoints: dashboardData.user.total_points
    });

    return res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('❌ Dashboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
};
