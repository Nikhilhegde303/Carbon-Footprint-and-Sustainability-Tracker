import { useState, useEffect, useContext } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getDashboardData, getActivities } from '../utils/api.js'
import './Dashboard.css'

const Dashboard = () => {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPoints: 0,
    activitiesCount: 0,
    carbonReduced: 0,
    challengesJoined: 0
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch dashboard stats and recent activities
      const [dashboardResponse, activitiesResponse] = await Promise.all([
        getDashboardData(),
        getActivities()
      ])

      console.log('📊 Dashboard data:', dashboardResponse)
      console.log('📋 Activities data:', activitiesResponse)

      setDashboardData(dashboardResponse)
      setRecentActivities(activitiesResponse.slice(0, 5)) // Show last 5 activities

      // Calculate stats from activities
      if (activitiesResponse.length > 0) {
        const totalEmission = activitiesResponse.reduce((sum, activity) => 
          sum + parseFloat(activity.calculated_emission), 0
        )
        const totalPoints = activitiesResponse.reduce((sum, activity) => 
          sum + activity.points_earned, 0
        )

        setStats({
          totalPoints: user?.total_points || totalPoints,
          activitiesCount: activitiesResponse.length,
          carbonReduced: totalEmission,
          challengesJoined: dashboardResponse?.joined_challenges_count || 0
        })
      } else {
        // Use user data if no activities
        setStats({
          totalPoints: user?.total_points || 0,
          activitiesCount: 0,
          carbonReduced: 0,
          challengesJoined: dashboardResponse?.joined_challenges_count || 0
        })
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Set default stats if API fails
      setStats({
        totalPoints: user?.total_points || 0,
        activitiesCount: 0,
        carbonReduced: 0,
        challengesJoined: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your carbon footprint data...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>{getGreeting()}, {user?.first_name}!</h1>
        <p>Track your carbon reduction journey</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🌱</div>
          <div className="stat-content">
            <h3>{stats.carbonReduced.toFixed(2)} kg</h3>
            <p>CO₂ Reduced</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.activitiesCount}</h3>
            <p>Activities Logged</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>{stats.totalPoints}</h3>
            <p>Total Points</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <h3>{stats.challengesJoined}</h3>
            <p>Challenges Joined</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Recent Activities Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Activities</h2>
            <button 
              className="view-all-btn"
              onClick={() => window.location.href = '/activities'}
            >
              View All
            </button>
          </div>

          {recentActivities.length > 0 ? (
            <div className="activities-list">
              {recentActivities.map((activity, index) => (
                <div key={activity.activity_id || index} className="activity-item">
                  <div className="activity-icon">
                    {activity.category === 'Transport' ? '🚗' : 
                     activity.category === 'Energy' ? '⚡' : 
                     activity.category === 'waste' ? '🗑️' : '📝'}
                  </div>
                  <div className="activity-details">
                    <h4>{activity.activity_name}</h4>
                    <p>{new Date(activity.activity_date).toLocaleDateString()}</p>
                  </div>
                  <div className="activity-stats">
                    <span className="emission">{activity.calculated_emission} kg CO₂</span>
                    <span className="points">+{activity.points_earned} points</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-activities">
              <div className="no-data-icon">📝</div>
              <h3>No activities yet</h3>
              <p>Start tracking your carbon footprint by logging your first activity!</p>
              <button 
                className="cta-button"
                onClick={() => window.location.href = '/activities'}
              >
                Log Your First Activity
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="quick-actions">
            <div 
              className="action-card"
              onClick={() => window.location.href = '/activities'}
            >
              <div className="action-icon">➕</div>
              <h4>Log Activity</h4>
              <p>Add new carbon emission data</p>
            </div>

            <div 
              className="action-card"
              onClick={() => window.location.href = '/challenges'}
            >
              <div className="action-icon">🎯</div>
              <h4>Join Challenge</h4>
              <p>Participate in carbon reduction challenges</p>
            </div>

            <div 
              className="action-card"
              onClick={() => window.location.href = '/rewards'}
            >
              <div className="action-icon">🏆</div>
              <h4>Redeem Rewards</h4>
              <p>Use your points for rewards</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard