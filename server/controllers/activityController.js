import pool from '../config/database.js';

export const addActivity = async (req, res) => {
  try {
    const { factor_id, consumption_value, activity_date } = req.body;
    const userId = req.user.userId;

    console.log('🔵 Adding activity for user:', userId, req.body);

    // Get emission factor
    const [factors] = await pool.execute(
      'SELECT * FROM emission_factor WHERE factor_id = ?',
      [factor_id]
    );

    if (factors.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid activity type'
      });
    }

    const factor = factors[0];
    const calculatedEmission = consumption_value * factor.emission_factor;
    const pointsEarned = Math.round(calculatedEmission * 10);

    // Insert activity
    const [result] = await pool.execute(
      `INSERT INTO activity 
       (user_id, factor_id, activity_date, consumption_value, calculated_emission, points_earned) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, factor_id, activity_date, consumption_value, calculatedEmission, pointsEarned]
    );

    // Update user points
    await pool.execute(
      'UPDATE user SET total_points = total_points + ? WHERE user_id = ?',
      [pointsEarned, userId]
    );

    console.log('✅ Activity added successfully');

    res.json({
      success: true,
      message: 'Activity added successfully!',
      activityId: result.insertId,
      pointsEarned: pointsEarned,
      calculatedEmission: calculatedEmission,
      activityName: factor.activity_name
    });

  } catch (error) {
    console.error('❌ Error adding activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add activity'
    });
  }
};

export const getActivities = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [activities] = await pool.execute(`
      SELECT 
        a.activity_id,
        a.activity_date,
        a.consumption_value,
        a.calculated_emission,
        a.points_earned,
        ef.activity_name,
        ef.unit,
        ef.category,
        ef.emission_factor
      FROM activity a
      INNER JOIN emission_factor ef ON a.factor_id = ef.factor_id
      WHERE a.user_id = ?
      ORDER BY a.activity_date DESC, a.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      data: activities
    });

  } catch (error) {
    console.error('❌ Error fetching activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities'
    });
  }
};