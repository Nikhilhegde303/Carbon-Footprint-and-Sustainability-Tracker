import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import activityRoutes from './routes/activityRoutes.js';

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/activities', activityRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Carbon Footprint Tracker API' })
})

// 404 handler - FIXED: Remove the problematic wildcard route
// app.use('*', (req, res) => {  // REMOVE THIS LINE
//   res.status(404).json({ 
//     success: false, 
//     message: 'Route not found' 
//   })
// })

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!' 
  })
})

// Simple 404 handler at the end
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  })
})



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})