import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function LandingPage() {
  const { user } = useAuth()

  return (
    <div style={{ padding: '2rem' }}>
      <section style={{ 
        textAlign: 'center', 
        padding: '4rem 2rem',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        borderRadius: '1rem',
        marginBottom: '3rem'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          Track Your Carbon, Shape Your Future
        </h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
          Measure, reduce, and earn rewards for your sustainable choices. Join thousands making a difference today.
        </p>
        
        {user ? (
          <Link to="/profile">
            <button style={{
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              backgroundColor: 'white',
              color: '#059669',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer'
            }}>
              Go to Dashboard
            </button>
          </Link>
        ) : (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/register">
              <button style={{
                padding: '1rem 2rem',
                fontSize: '1.1rem',
                backgroundColor: 'white',
                color: '#059669',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}>
                Get Started
              </button>
            </Link>
            <Link to="/login">
              <button style={{
                padding: '1rem 2rem',
                fontSize: '1.1rem',
                backgroundColor: 'transparent',
                color: 'white',
                border: '2px solid white',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}>
                Login
              </button>
            </Link>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <div style={{ padding: '2rem', border: '1px solid #ddd', borderRadius: '0.5rem', textAlign: 'center' }}>
          <h3>📊 Smart Tracking</h3>
          <p>Log daily activities and calculate your carbon emissions automatically</p>
        </div>
        
        <div style={{ padding: '2rem', border: '1px solid #ddd', borderRadius: '0.5rem', textAlign: 'center' }}>
          <h3>🎯 Goal Setting</h3>
          <p>Set personal reduction targets and track your progress</p>
        </div>
        
        <div style={{ padding: '2rem', border: '1px solid #ddd', borderRadius: '0.5rem', textAlign: 'center' }}>
          <h3>🏆 Earn Rewards</h3>
          <p>Get points for eco-friendly activities and redeem exciting rewards</p>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ textAlign: 'center', padding: '3rem 2rem', backgroundColor: '#f8fafc', borderRadius: '1rem' }}>
        <h2>Make a Difference Today</h2>
        <p>Join thousands of users reducing their carbon footprint</p>
      </section>
    </div>
  )
}

export default LandingPage