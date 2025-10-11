import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Layout/Navbar'
import LandingPage from './pages/LandingPage'
import Register from './pages/Register'
import Login from './pages/Login'
import UserProfile from './pages/UserProfile'
import ActivityPage from './pages/ActivityPage'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={ <ProtectedRoute> <UserProfile /> </ProtectedRoute>} />
            <Route path="/activity" element={<ProtectedRoute><ActivityPage /></ProtectedRoute>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" />
}

export default App