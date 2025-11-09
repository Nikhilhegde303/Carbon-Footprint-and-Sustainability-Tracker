// client/src/pages/Dashboard.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getDashboardData } from '../utils/api.js'
import './Dashboard.css'

// Chart imports
import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
ChartJS.register(ArcElement, Tooltip, Legend)

const Dashboard = () => {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await getDashboardData()
      console.log('📊 Dashboard response:', data)

      setDashboardData(data)
    } catch (err) {
      console.error('❌ Error fetching dashboard:', err)
      setError(err.message || 'Failed to load dashboard data')
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

  const getEmissionLevel = (emission) => {
    const num = Number(emission) || 0
    if (num < 10) return 'low'
    if (num < 50) return 'medium'
    return 'high'
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your carbon footprint data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="error-icon">⚠️</div>
        <h3>Unable to load dashboard</h3>
        <p>{error}</p>
        <button onClick={fetchDashboardData} className="retry-btn">
          Try Again
        </button>
      </div>
    )
  }

  const stats = dashboardData?.stats ?? {}
  const recentActivities = dashboardData?.recent_activities ?? []
  const userData = dashboardData?.user ?? user ?? {}

  // Chart data (safe)
  const chartLabels = (dashboardData?.category_breakdown || []).map(c => c.category)
  const chartValues = (dashboardData?.category_breakdown || []).map(c => Number(c.total_emission) || 0)

  const pieData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'CO₂ Emission (kg)',
        data: chartValues,
        // colors will be applied by Chart defaults if not specified
        backgroundColor: [
          'rgba(75,192,192,0.6)',
          'rgba(54,162,235,0.6)',
          'rgba(255,206,86,0.6)',
          'rgba(255,99,132,0.6)',
          'rgba(153,102,255,0.6)'
        ],
        borderColor: '#fff',
        borderWidth: 1
      }
    ]
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>{getGreeting()}, {userData?.first_name || 'Friend'}!</h1>
        <p>Track your carbon reduction journey</p>
        <div className="user-points">
          <span className="points-badge">⭐ {userData?.total_points || 0} Points</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🌱</div>
          <div className="stat-content">
            <h3>{stats.total_emission ?? '0.00'} kg</h3>
            <p>CO₂ Tracked</p>
            <span className={`emission-level ${getEmissionLevel(stats.total_emission)}`}>
              {getEmissionLevel(stats.total_emission).toUpperCase()} EMISSION
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.total_activities ?? 0}</h3>
            <p>Activities Logged</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>{stats.total_points_earned ?? 0}</h3>
            <p>Total Points Earned</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <h3>{stats.joined_challenges_count ?? 0}</h3>
            <p>Challenges Joined</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Activities</h2>
            <button
              className="view-all-btn"
              onClick={() => (window.location.href = '/activities')}
            >
              View All
            </button>
          </div>

          {recentActivities.length > 0 ? (
            <div className="activities-list">
              {recentActivities.map((activity, index) => (
                <div key={activity.activity_id ?? index} className="activity-item">
                  <div className="activity-icon">
                    {activity.category === 'Transport' ? '🚗' :
                      activity.category === 'Energy' ? '⚡' :
                        activity.category?.toLowerCase() === 'waste' ? '🗑️' : '📝'}
                  </div>
                  <div className="activity-details">
                    <h4>{activity.activity_name}</h4>
                    <p>{new Date(activity.activity_date).toLocaleDateString()}</p>
                    <span className="consumption">
                      {activity.consumption_value} {activity.unit?.replace('kg CO2/', '')}
                    </span>
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
                onClick={() => (window.location.href = '/activities')}
              >
                Log Your First Activity
              </button>
            </div>
          )}
        </div>

        

        {/* Category Breakdown + Chart */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Emission by Category</h2>
          </div>

          {dashboardData?.category_breakdown?.length > 0 ? (
            <>
              <div className="category-breakdown">
                {dashboardData.category_breakdown.map(category => (
                  <div key={category.category} className="category-item">
                    <div className="category-header">
                      <span className="category-name">{category.category}</span>
                      <span className="category-count">{category.activity_count} activities</span>
                    </div>
                    <div className="category-stats">
                      <span className="category-emission">
                        {parseFloat(category.total_emission).toFixed(2)} kg CO₂
                      </span>
                      <span className="category-points">
                        {category.total_points} points
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="chart-wrapper">
                <Pie data={pieData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
              </div>
            </>
          ) : (
            <div className="no-data-small">No category data yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
