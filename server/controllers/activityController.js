import pool from '../config/database.js';
import { updateChallengeProgress } from '../utils/challengeProgress.js';

// --- Sophisticated Points Calculation ---
const calculatePoints = (activityType, calculatedEmission, consumptionValue) => {
  console.log('🔢 Calculating points for:', { activityType, calculatedEmission, consumptionValue });

  let basePoints = 0;
  let efficiencyBonus = 0;
  let sustainabilityBonus = 0;

  switch (activityType) {
    case 'Car (Petrol)':
      basePoints = 15;
      const carEmissionPerKm = calculatedEmission / consumptionValue;
      if (carEmissionPerKm < 0.15) efficiencyBonus = 25;
      else if (carEmissionPerKm < 0.18) efficiencyBonus = 15;
      else efficiencyBonus = 5;
      break;

    case 'Bus':
      basePoints = 25;
      efficiencyBonus = 20;
      sustainabilityBonus = 15;
      break;

    case 'Electricity':
      basePoints = 20;
      if (consumptionValue < 5) efficiencyBonus = 30;
      else if (consumptionValue < 10) efficiencyBonus = 20;
      else efficiencyBonus = 10;
      break;

    case 'Beef':
      basePoints = 8;
      if (consumptionValue < 0.3) efficiencyBonus = 15;
      else if (consumptionValue < 0.5) efficiencyBonus = 8;
      else efficiencyBonus = 2;
      break;

    case 'Vegetables':
      basePoints = 20;
      efficiencyBonus = 15;
      sustainabilityBonus = 10;
      break;

    default:
      basePoints = 15;
      efficiencyBonus = 10;
  }

  const totalPoints = basePoints + efficiencyBonus + sustainabilityBonus;
  console.log('📊 Points breakdown:', { basePoints, efficiencyBonus, sustainabilityBonus, totalPoints });
  
  return Math.max(5, Math.min(totalPoints, 100));
};

// --- Add Activity ---
export const addActivity = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { factor_id, consumption_value, activity_date } = req.body;
    const userId = req.user.userId;

    console.log('🔵 Adding activity:', { userId, factor_id, consumption_value, activity_date });

    if (!factor_id || !consumption_value || !activity_date) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: factor_id, consumption_value, activity_date',
      });
    }

    if (consumption_value <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Consumption value must be greater than 0',
      });
    }

    const [factors] = await connection.execute(
      'SELECT * FROM emission_factor WHERE factor_id = ?',
      [factor_id]
    );

    if (!factors || factors.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid activity type selected',
      });
    }

    const factor = factors[0];
    const calculatedEmission = parseFloat(
      (consumption_value * factor.emission_factor).toFixed(4)
    );

    const pointsEarned = calculatePoints(
      factor.activity_name,
      calculatedEmission,
      consumption_value
    );

    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO activity 
         (user_id, factor_id, activity_date, consumption_value, calculated_emission, points_earned, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [userId, factor_id, activity_date, consumption_value, calculatedEmission, pointsEarned]
    );

    await connection.execute(
      'UPDATE user SET total_points = total_points + ? WHERE user_id = ?',
      [pointsEarned, userId]
    );

    await connection.commit();

    console.log('✅ Activity added successfully:', result.insertId);

    // Update challenge progress (non-critical, so don't fail if this errors)
    try {
      await updateChallengeProgress(userId);
      console.log('✅ Challenge progress updated');
    } catch (progressError) {
      console.error('⚠️ Challenge progress update failed:', progressError);
      // Continue - don't fail the activity addition
    }

    res.json({
      success: true,
      message: `Activity logged successfully! Earned ${pointsEarned} points`,
      activityId: result.insertId,
      pointsEarned,
      calculatedEmission,
      activityName: factor.activity_name,
    });
  } catch (error) {
    console.error('❌ Error adding activity:', error);
    if (connection) await connection.rollback();
    res.status(500).json({
      success: false,
      message: 'Failed to add activity to database',
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
};

// --- Get Activities ---
export const getActivities = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('🔵 Fetching activities for user:', userId);

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

    res.json({ success: true, data: activities });
  } catch (error) {
    console.error('❌ Error fetching activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities from database',
      error: error.message,
    });
  }
};