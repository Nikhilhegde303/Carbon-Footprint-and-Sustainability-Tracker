import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      padding: '1rem 2rem',
      borderBottom: '1px solid #ccc',
      backgroundColor: '#2d6a4f',
      color: 'white'
    }}>
      <div className="nav-brand">
        <Link to="/" style={{ 
          textDecoration: 'none', 
          fontSize: '1.5rem', 
          fontWeight: 'bold',
          color: 'white'
        }}>
          🌱 EcoTrack
        </Link>
      </div>
      
      <div className="nav-links" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        {user ? (
          <>
            <span style={{ color: 'white' }}>Welcome, {user.first_name || user.firstName}</span>
            <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>Dashboard</Link>
            <Link to="/activities" style={{ color: 'white', textDecoration: 'none' }}>Activities</Link>
            <Link to="/challenges" style={{ color: 'white', textDecoration: 'none' }}>Challenges</Link>
            <Link to="/rewards" style={{ color: 'white', textDecoration: 'none' }}>Rewards</Link>
            <button 
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'white',
                color: '#2d6a4f',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/register" style={{ color: 'white', textDecoration: 'none' }}>Register</Link>
            <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>Login</Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar