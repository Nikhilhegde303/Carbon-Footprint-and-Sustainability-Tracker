import jwt from 'jsonwebtoken'
import pool from '../config/database.js'

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    
    // Get user from database - Use exact column names
    const [users] = await pool.execute(
      'SELECT user_id, first_name, last_name, email, user_type, total_points FROM user WHERE user_id = ?',
      [decoded.userId]
    )

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      })
    }

    req.user = {
      userId: users[0].user_id,
      firstName: users[0].first_name,
      lastName: users[0].last_name,
      email: users[0].email,
      userType: users[0].user_type,
      totalPoints: users[0].total_points
    }

    next()
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    })
  }
}