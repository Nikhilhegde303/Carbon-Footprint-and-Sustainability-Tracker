import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

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
      borderBottom: '1px solid #ccc'
    }}>
      <div className="nav-brand">
        <Link to="/" style={{ textDecoration: 'none', fontSize: '1.5rem', fontWeight: 'bold' }}>
          🌱 EcoTrack
        </Link>
      </div>
      
      <div className="nav-links" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {user ? (
          <>
            <span>Welcome, {user.firstName}</span>
            <Link to="/profile">Profile</Link>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/register">Register</Link>
            <Link to="/login">Login</Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar