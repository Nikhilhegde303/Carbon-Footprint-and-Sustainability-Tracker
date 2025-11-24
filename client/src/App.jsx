import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Navbar from './components/Layout/Navbar.jsx'
import LandingPage from './pages/LandingPage.jsx'
import Register from './pages/Register.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ActivityPage from './pages/ActivityPage.jsx'
import ChallengesPage from './pages/ChallengesPage.jsx'
import RewardsPage from './pages/RewardsPage.jsx'
import NewsPage from './pages/NewsPage.jsx';

//import './App.css'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="loading">Loading...</div>
  }
  
  return user ? children : <Navigate to="/login" />
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              
              {/* Protected Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/activities" 
                element={
                  <ProtectedRoute>
                    <ActivityPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/challenges" 
                element={
                  <ProtectedRoute>
                    <ChallengesPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/rewards" 
                element={
                  <ProtectedRoute>
                    <RewardsPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route path="/news" 
              element={<NewsPage />
              } 
              />

              
              {/* Catch all route - redirect to home */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App