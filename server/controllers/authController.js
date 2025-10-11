import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../config/database.js'

export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, userType } = req.body

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT user_id FROM user WHERE email = ?',
      [email]
    )

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      })
    }

    // Hash password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Insert new user - Use exact column names from your database
    const [result] = await pool.execute(
      `INSERT INTO user (first_name, last_name, email, password, user_type) 
       VALUES (?, ?, ?, ?, ?)`,
      [firstName, lastName, email, hashedPassword, userType]
    )

    res.status(201).json({
      success: true,
      message: 'User registered successfully'
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user - Use exact column names
    const [users] = await pool.execute(
      `SELECT user_id, first_name, last_name, email, password, user_type, total_points 
       FROM user WHERE email = ?`,
      [email]
    )

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    const user = users[0]

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    // User data to send back (without password)
    const userData = {
      userId: user.user_id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      userType: user.user_type,
      totalPoints: user.total_points
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: userData,
      token
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}