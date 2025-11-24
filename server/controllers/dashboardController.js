// server/controllers/dashboardController.js
import pool from '../config/database.js';

export const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.userId;

    // 1) Basic user + sums
    const [userStats] = await pool.execute(
      `
      SELECT 
        u.user_id,
        u.first_name,
        u.last_name,
        u.total_points,
        u.date_joined,
        COUNT(a.activity_id) AS total_activities,
        COALESCE(SUM(a.calculated_emission), 0) AS total_emission,
        COALESCE(SUM(a.points_earned), 0) AS total_points_earned
      FROM user u
      LEFT JOIN activity a ON u.user_id = a.user_id
      WHERE u.user_id = ?
      GROUP BY u.user_id, u.first_name, u.last_name, u.total_points, u.date_joined
      `,
      [userId]
    );

    if (!userStats || userStats.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userRow = userStats[0];

    // 2) Recent activities
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
        COUNT(a.activity_id) AS activity_count,
        COALESCE(SUM(a.calculated_emission), 0) AS total_emission,
        COALESCE(SUM(a.points_earned), 0) AS total_points
      FROM activity a
      INNER JOIN emission_factor ef ON a.factor_id = ef.factor_id
      WHERE a.user_id = ?
      GROUP BY ef.category
      `,
      [userId]
    );

    // 4) Challenges joined (safe fallback)
    let joinedChallengesCount = 0;
    try {
      const [rows] = await pool.execute(
        `SELECT COUNT(*) AS cnt FROM user_challenges WHERE user_id = ?`,
        [userId]
      );
      joinedChallengesCount = rows?.[0]?.cnt || 0;
    } catch {
      joinedChallengesCount = 0;
    }

    // 5) Weekly comparison
    const [[weekly]] = await pool.execute(
      `
      SELECT
        (SELECT COALESCE(SUM(calculated_emission), 0)
         FROM activity
         WHERE user_id = ?
           AND activity_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        ) AS this_week,
        (SELECT COALESCE(SUM(calculated_emission), 0)
         FROM activity
         WHERE user_id = ?
           AND activity_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
           AND activity_date <  DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        ) AS last_week
      `,
      [userId, userId]
    );

    const thisWeekEmission = Number(weekly.this_week) || 0;
    const lastWeekEmission = Number(weekly.last_week) || 0;
    const delta = lastWeekEmission - thisWeekEmission; // positive = improvement

    // Suggested weekly score (not stored yet)
    let weeklyPoints = 0;
    if (lastWeekEmission > 0 && delta > 0) {
      weeklyPoints = Math.round((delta / lastWeekEmission) * 50);
      if (weeklyPoints < 5) weeklyPoints = 5;
      if (weeklyPoints > 50) weeklyPoints = 50;
    }

    // 6) Determine highest emission category for tips
    const [topCat] = await pool.execute(
      `
      SELECT ef.category, SUM(a.calculated_emission) AS total
      FROM activity a
      JOIN emission_factor ef ON a.factor_id = ef.factor_id
      WHERE a.user_id = ?
      GROUP BY ef.category
      ORDER BY total DESC
      LIMIT 1
      `,
      [userId]
    );

    const tipCategory = topCat?.[0]?.category || 'lifestyle';

    const tipsMap = {
      Transport: [
        'Try using public transport for short trips.',
        'Consider carpooling with friends or colleagues.',
        'Ensure proper tyre pressure to improve mileage.'
      ],
      Energy: [
        'Turn off appliances when not in use.',
        'Use LED bulbs to reduce energy consumption.',
        'Keep AC temperature at 24–26°C for efficiency.'
      ],
      Food: [
        'Reduce red meat intake to lower carbon footprint.',
        'Choose seasonal and local produce.',
        'Avoid food waste by planning meals beforehand.'
      ],
      lifestyle: [
        'Repair before replacing household items.',
        'Donate or recycle items instead of throwing away.',
        'Avoid unnecessary purchases where possible.'
      ]
    };

    const weeklyTips = tipsMap[tipCategory] || tipsMap.lifestyle;

    // Final Response
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
        joined_challenges_count: parseInt(joinedChallengesCount, 10) || 0,

        // ✅ Weekly Metrics
        this_week_emission: thisWeekEmission.toFixed(2),
        last_week_emission: lastWeekEmission.toFixed(2),
        change_percentage:
          lastWeekEmission > 0
            ? (((lastWeekEmission - thisWeekEmission) / lastWeekEmission) * 100).toFixed(1)
            : 0
      },
      recent_activities: recentActivities || [],
      category_breakdown: categoryBreakdown || [],
      weekly: {
        this_week_kg: thisWeekEmission.toFixed(2),
        last_week_kg: lastWeekEmission.toFixed(2),
        delta_kg: delta.toFixed(2),
        points_award: weeklyPoints,
        tips: weeklyTips
      }
    };

    return res.json({ success: true, data: dashboardData });

  } catch (error) {
    console.error('❌ Dashboard error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching dashboard data' });
  }
};
