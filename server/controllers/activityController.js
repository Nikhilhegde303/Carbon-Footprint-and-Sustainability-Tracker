import pool from '../config/database.js';
import { updateChallengeProgress } from '../utils/challengeProgress.js';

// --- Lightweight eco feedback engine (no points on log) ---
const classifyEmission = (category, kg) => {
  const c = String(category || '').toLowerCase();

  // simple, interpretable thresholds (kg CO2) per log
  const bands = c.includes('transport')
    ? { low: 2, med: 8 }
    : c.includes('energy')
    ? { low: 3, med: 10 }
    : c.includes('diet') || c.includes('food')
    ? { low: 1, med: 3 }
    : { low: 1, med: 2 }; // lifestyle/other

  if (kg <= bands.low) return 'low';
  if (kg <= bands.med) return 'medium';
  return 'high';
};

const tipsByCategory = (category) => {
  const c = String(category || '').toLowerCase();
  if (c.includes('transport')) {
    return [
      'Try public transport or carpool for similar trips.',
      'Combine errands to reduce total distance.',
      'Keep tyre pressure optimal for efficiency.'
    ];
  }
  if (c.includes('energy')) {
    return [
      'Turn off appliances at the wall to avoid standby usage.',
      'Shift heavy usage to daytime if you have rooftop solar.',
      'Use LED bulbs and set AC to 24–26°C.'
    ];
  }
  if (c.includes('diet') || c.includes('food')) {
    return [
      'Prefer seasonal, local produce to reduce embedded emissions.',
      'Plan meals to avoid food waste.',
      'Swap one red-meat meal for plant-based this week.'
    ];
  }
  return [
    'Choose durable, repairable items over disposables.',
    'Recycle and donate items instead of discarding.',
    'Ask: do I need this, or is there a lower-impact alternative?'
  ];
};

// --- Add Activity (no per-activity points; only emission & feedback) ---
export const addActivity = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { factor_id, consumption_value, activity_date } = req.body;
    const userId = req.user.userId;

    if (!factor_id || !consumption_value || !activity_date) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: factor_id, consumption_value, activity_date',
      });
    }
    if (Number(consumption_value) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Consumption value must be greater than 0',
      });
    }

    const [factors] = await connection.execute(
      'SELECT factor_id, activity_name, emission_factor, unit, category FROM emission_factor WHERE factor_id = ?',
      [factor_id]
    );
    if (!factors || factors.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid activity type selected' });
    }

    const factor = factors[0];
    const calculatedEmission = parseFloat(
      (Number(consumption_value) * Number(factor.emission_factor)).toFixed(4)
    );

    // Points per activity are now **zero**; points come from weekly reduction only
    const pointsEarned = 0;

    await connection.beginTransaction();
    const [result] = await connection.execute(
      `INSERT INTO activity 
         (user_id, factor_id, activity_date, consumption_value, calculated_emission, points_earned, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [userId, factor_id, activity_date, consumption_value, calculatedEmission, pointsEarned]
    );
    await connection.commit();

    // Update challenge progress (best-effort)
    try {
      await updateChallengeProgress(userId);
    } catch (e) {
      console.warn('Challenge progress update failed:', e?.message || e);
    }

    // Prepare UX feedback
    const level = classifyEmission(factor.category, calculatedEmission);
    const tips = tipsByCategory(factor.category);

    return res.json({
      success: true,
      message: `Activity logged successfully.`,
      activityId: result.insertId,
      calculatedEmission,
      activityName: factor.activity_name,
      unit: factor.unit,
      feedback: {
        level,                // 'low' | 'medium' | 'high'
        summary:
          level === 'low'
            ? '✅ Low-emission entry. Great job!'
            : level === 'medium'
            ? '🙂 Moderate emissions. There’s room to improve.'
            : '⚠️ High emissions for this category.',
        suggestions: tips
      }
    });
  } catch (error) {
    console.error('❌ Error adding activity:', error);
    if (connection) await connection.rollback();
    return res.status(500).json({ success: false, message: 'Failed to add activity', error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

// --- Get Activities (unchanged except points_earned might be zero for new rows) ---
export const getActivities = async (req, res) => {
  try {
    const userId = req.user.userId;
    const [activities] = await pool.execute(
      `
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
      `,
      [userId]
    );
    return res.json({ success: true, data: activities });
  } catch (error) {
    console.error('❌ Error fetching activities:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch activities', error: error.message });
  }
};
