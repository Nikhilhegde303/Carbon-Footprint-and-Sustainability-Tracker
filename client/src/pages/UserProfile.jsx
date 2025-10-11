import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getUserProfile } from '../utils/api'
import { useNavigate } from 'react-router-dom'



function UserProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getUserProfile()
        if (response.success) {
          setProfile(response.data)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1>Your Profile</h1>
        <p>Welcome back, {user.firstName}!</p>
      </div>

      {/* <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem', 
        marginBottom: '3rem' 
      }}>
        <div style={{ 
          padding: '2rem', 
          border: '1px solid #ddd', 
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <h3>Total Points</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
            {profile?.totalPoints || 0}
          </p>
        </div>
        
        <div style={{ 
          padding: '2rem', 
          border: '1px solid #ddd', 
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <h3>Carbon Reduced</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
            -- kg CO₂
          </p>
        </div>
        
        <div style={{ 
          padding: '2rem', 
          border: '1px solid #ddd', 
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <h3>Active Goals</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
            --
          </p>
        </div>
      </div> */}

      
      <div style={{ display: 'grid', gap: '2rem' }}>
        <section style={{ 
          padding: '2rem', 
          border: '1px solid #ddd', 
          borderRadius: '0.5rem'
        }}>
          <h2>Activities</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => navigate('/activity')}
              style={{ padding: '0.5rem 1rem' }}
            >
              Add Activity
            </button>
            <button 
              onClick={() => navigate('/activity')}
              style={{ padding: '0.5rem 1rem' }}
            >
              See Activities
            </button>
          </div>
        </section>

        {/* <section style={{ 
          padding: '2rem', 
          border: '1px solid #ddd', 
          borderRadius: '0.5rem'
        }}>
          <h2>Your Goals</h2>
          <p>Set and track your reduction goals</p>
        </section> */}

        {/* <section style={{ 
          padding: '2rem', 
          border: '1px solid #ddd', 
          borderRadius: '0.5rem'
        }}>
          <h2>Your Rewards</h2>
          <p>Track your points and available rewards</p>
        </section> */}
      </div>
    </div>
  )
}

export default UserProfile