import pool from '../config/database.js';

// Get all available rewards - FIXED: redemption table column name
const getRewards = async (req, res) => {
  try {
    const [rewards] = await pool.execute(`
      SELECT 
        r.*,
        (r.stock_count - COALESCE(red.redemption_count, 0)) as available_stock,
        CASE 
          WHEN u.total_points >= r.points_required THEN 'eligible'
          ELSE 'not_eligible'
        END as user_eligibility
      FROM reward r
      LEFT JOIN (
        SELECT reward_id, COUNT(*) as redemption_count 
        FROM redemption 
        GROUP BY reward_id
      ) red ON r.reward_id = red.reward_id
      CROSS JOIN user u
      WHERE u.user_id = ?
      HAVING available_stock > 0
      ORDER BY r.points_required ASC
    `, [req.user.userId]);

    res.json({ success: true, data: rewards });
  } catch (error) {
    console.error('Get rewards error:', error);
    res.status(500).json({ success: false, message: 'Error fetching rewards' });
  }
};

// Redeem a reward - FIXED: redemption table column name
const redeemReward = async (req, res) => {
  const { reward_id } = req.body;

  try {
    await pool.execute('START TRANSACTION');

    // Get user points and reward details using JOIN
    const [userReward] = await pool.execute(`
      SELECT u.user_id, u.total_points, r.points_required, r.stock_count,
             COUNT(red.redemption_id) as redeemed_count
      FROM user u
      CROSS JOIN reward r
      LEFT JOIN redemption red ON r.reward_id = red.reward_id
      WHERE u.user_id = ? AND r.reward_id = ?
      GROUP BY u.user_id, r.reward_id
    `, [req.user.userId, reward_id]);

    if (userReward.length === 0) {
      await pool.execute('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Reward not found' });
    }

    const { total_points, points_required, stock_count, redeemed_count } = userReward[0];
    const available_stock = stock_count - redeemed_count;

    if (total_points < points_required) {
      await pool.execute('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Insufficient points' });
    }

    if (available_stock <= 0) {
      await pool.execute('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Reward out of stock' });
    }

    // Create redemption record - FIXED: column name redumption_date -> redemption_date
    await pool.execute(
      'INSERT INTO redemption (user_id, reward_id, points_spent) VALUES (?, ?, ?)',
      [req.user.userId, reward_id, points_required]
    );

    // Update user points using arithmetic operation
    await pool.execute(
      'UPDATE user SET total_points = total_points - ? WHERE user_id = ?',
      [points_required, req.user.userId]
    );

    await pool.execute('COMMIT');
    
    res.json({ 
      success: true,
      message: 'Reward redeemed successfully!',
      points_remaining: total_points - points_required
    });
  } catch (error) {
    await pool.execute('ROLLBACK');
    console.error('Redeem reward error:', error);
    res.status(500).json({ success: false, message: 'Error redeeming reward' });
  }
};

// Get user's redemption history - FIXED: redemption table column name
const getRedemptionHistory = async (req, res) => {
  try {
    const [history] = await pool.execute(`
      SELECT 
        r.name as reward_name,
        r.description,
        red.points_spent,
        red.redumption_date as redemption_date,
        u.total_points as current_points
      FROM redemption red
      INNER JOIN reward r ON red.reward_id = r.reward_id
      INNER JOIN user u ON red.user_id = u.user_id
      WHERE red.user_id = ?
      ORDER BY red.redumption_date DESC
      LIMIT 10
    `, [req.user.userId]);

    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Get redemption history error:', error);
    res.status(500).json({ success: false, message: 'Error fetching redemption history' });
  }
};

export { getRewards, redeemReward, getRedemptionHistory };