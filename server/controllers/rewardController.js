import pool from '../config/database.js';

/**
 * ✅ Get all available rewards
 */
export const getRewards = async (req, res) => {
  try {
    const [rewards] = await pool.execute(
      `SELECT reward_id, name, description, points_required, stock_count
       FROM reward
       WHERE stock_count > 0
       ORDER BY points_required ASC`
    );

    res.json({ success: true, data: rewards });
  } catch (error) {
    console.error('❌ Error fetching rewards:', error);
    res.status(500).json({ success: false, message: 'Failed to load rewards.' });
  }
};

/**
 * ✅ Redeem a reward
 */
export const redeemReward = async (req, res) => {
  const userId = req.user?.userId ?? req.user?.user_id;
  const { reward_id } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  if (!reward_id) {
    return res.status(400).json({ success: false, message: 'reward_id is required' });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1) Get reward details
    const [[reward]] = await connection.execute(
      `SELECT reward_id, name, points_required, stock_count
       FROM reward
       WHERE reward_id = ?
       FOR UPDATE`,
      [reward_id]
    );

    if (!reward) {
      throw new Error('Reward not found');
    }

    if (reward.stock_count <= 0) {
      throw new Error('Reward out of stock');
    }

    // 2) Compute user available points (same as Dashboard)
    const [[pointsRow]] = await connection.execute(
      `SELECT SUM(points_earned) AS total_points
       FROM activity
       WHERE user_id = ?`,
      [userId]
    );

    const userPoints = Number(pointsRow.total_points || 0);

    if (userPoints < reward.points_required) {
      throw new Error('Not enough points');
    }

    // 3) Deduct stock (we do NOT touch user.total_points)
   await connection.execute(
  `UPDATE reward SET stock_count = stock_count - 1 WHERE reward_id = ?`,
  [reward.reward_id]
);

    // 4) Record redemption
    await connection.execute(
  `UPDATE user SET total_points = total_points - ? WHERE user_id = ?`,
  [reward.points_required, userId]
);

// 5) Record redemption
await connection.execute(
  `INSERT INTO redemption (user_id, reward_id, points_spent)
   VALUES (?, ?, ?)`,
  [userId, reward.reward_id, reward.points_required]
);

    await connection.commit();
    connection.release();

    return res.json({
      success: true,
      message: `🎉 Successfully redeemed ${reward.name}!`,
      new_balance: userPoints - reward.points_required
    });

  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('❌ Redeem reward error:', error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * ✅ Get redemption history for current user
 */
export const getRedemptionHistory = async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT r.redemption_id, rw.name, rw.description, r.points_spent, r.redumption_date
       FROM redemption r
       JOIN reward rw ON r.reward_id = rw.reward_id
       WHERE r.user_id = ?
       ORDER BY r.redumption_date DESC`,
      [userId]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('❌ Get redemption history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch redemption history' });
  }
};
