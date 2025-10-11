import pool from '../config/database.js';

// INSERT query - Add new activity
export const addActivity = async (req, res) => {
  try {
    const { factorId, consumption, date } = req.body;
    const userId = req.user.userId;

    console.log('Adding activity:', { userId, factorId, consumption, date });

    // Get emission factor from database
    const [factors] = await pool.execute(
      'SELECT emission_factor FROM emission_factor WHERE factor_id = ?',
      [factorId]
    );

    if (factors.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid activity type'
      });
    }

    const emissionFactor = factors[0].emission_factor;
    const calculatedEmission = consumption * emissionFactor;

    // Use your actual table column names
    const [result] = await pool.execute(
      'INSERT INTO activity (user_id, factor_id, activity_date, consumption_value, calculated_emission) VALUES (?, ?, ?, ?, ?)',
      [userId, factorId, date, consumption, calculatedEmission]
    );

    res.json({
      success: true,
      message: 'Activity added successfully',
      activityId: result.insertId
    });
  } catch (error) {
    console.error('Error adding activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add activity: ' + error.message
    });
  }
};

// SELECT query - Get user activities
export const getActivities = async (req, res) => {
  try {
    const userId = req.user.userId;

    console.log('Fetching activities for user:', userId);

    // Simple SELECT with your table columns
    const [activities] = await pool.execute(
      `SELECT 
        activity_id, 
        factor_id,
        activity_date, 
        consumption_value,
        calculated_emission,
        points_earned
       FROM activity 
       WHERE user_id = ? 
       ORDER BY activity_date DESC`,
      [userId]
    );

    console.log('Found activities:', activities);

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities: ' + error.message
    });
  }
};