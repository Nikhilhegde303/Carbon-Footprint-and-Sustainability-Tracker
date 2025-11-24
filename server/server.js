import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// Import routes
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import activityRoutes from './routes/activityRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import challengeRoutes from './routes/challengeRoutes.js'
import rewardRoutes from './routes/rewardRoutes.js'
import emissionRoutes from './routes/emissionRoutes.js'
import newsRoutes from './routes/newsRoutes.js';


dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Add this RIGHT AFTER your middleware, before other routes
app.post('/api/debug/register', (req, res) => {
  console.log('🔵 DEBUG REGISTER HIT - Request body:', req.body)
  res.json({ 
    success: true, 
    message: 'Debug endpoint working',
    received: req.body
  })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/activities', activityRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/challenges', challengeRoutes)
app.use('/api/rewards', rewardRoutes)
app.use('/api/emission-factors', emissionRoutes)
app.use('/api/news', newsRoutes);


// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Carbon Footprint Tracker API',
    version: '1.0.0'
  })
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running healthy'
  })
})

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err)
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error' 
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📍 http://localhost:${PORT}`)
})