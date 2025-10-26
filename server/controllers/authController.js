import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../config/database.js'

export const register = async (req, res) => {
  console.log('🔵 REGISTER ENDPOINT HIT')
  console.log('Request body:', req.body)
  
  const { first_name, last_name, email, password } = req.body

  // Validate required fields
  if (!first_name || !last_name || !email || !password) {
    console.log('❌ Missing fields')
    return res.status(400).json({ 
      success: false, 
      message: 'All fields are required' 
    })
  }

  try {
    console.log('🔵 Checking if user exists...')
    const [existingUsers] = await pool.execute(
      'SELECT user_id FROM user WHERE email = ?',
      [email]
    )

    if (existingUsers.length > 0) {
      console.log('❌ User already exists')
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email' 
      })
    }

    console.log('🔵 Hashing password...')
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    console.log('🔵 Creating user...')
    const [result] = await pool.execute(
      `INSERT INTO user (first_name, last_name, email, password, user_type) 
       VALUES (?, ?, ?, ?, 'individual')`,
      [first_name, last_name, email, hashedPassword]
    )

    console.log('✅ User created with ID:', result.insertId)

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.insertId, email },
      process.env.JWT_SECRET || 'fallback_secret_key_123',
      { expiresIn: '7d' }
    )

    // Get the created user data
    const [newUser] = await pool.execute(
      'SELECT user_id, first_name, last_name, email, total_points, date_joined FROM user WHERE user_id = ?',
      [result.insertId]
    )

    const userResponse = {
      user_id: newUser[0].user_id,
      first_name: newUser[0].first_name,
      last_name: newUser[0].last_name,
      email: newUser[0].email,
      total_points: newUser[0].total_points,
      date_joined: newUser[0].date_joined
    }

    console.log('✅ Registration successful for:', userResponse.email)
    
    // Send success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token: token,
      user: userResponse
    })

  } catch (error) {
    console.error('❌ Registration error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration',
      error: error.message 
    })
  }
}

export const login = async (req, res) => {
  console.log('🔵 LOGIN ENDPOINT HIT')
  console.log('Request body:', req.body)
  
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email and password are required' 
    })
  }

  try {
    const [users] = await pool.execute(
      `SELECT user_id, first_name, last_name, email, password, total_points, user_type 
       FROM user WHERE email = ?`,
      [email]
    )

    if (users.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email or password' 
      })
    }

    const user = users[0]

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email or password' 
      })
    }

    const token = jwt.sign(
      { userId: user.user_id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret_key_123',
      { expiresIn: '7d' }
    )

    const userResponse = {
      user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      total_points: user.total_points,
      user_type: user.user_type
    }

    console.log('✅ Login successful for:', userResponse.email)

    res.json({
      success: true,
      message: 'Login successful',
      token: token,
      user: userResponse
    })

  } catch (error) {
    console.error('❌ Login error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login'
    })
  }
}