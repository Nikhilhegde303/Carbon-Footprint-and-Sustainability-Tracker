import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getRewards, redeemReward, getRedemptionHistory } from '../utils/api.js'
import './RewardsPage.css'

const RewardsPage = () => {
  const { user } = useAuth()
  const [rewards, setRewards] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [rewardsData, historyData] = await Promise.all([
        getRewards(),
        getRedemptionHistory()
      ])
      setRewards(rewardsData)
      setHistory(historyData)
    } catch (error) {
      console.error('Error fetching rewards:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRedeem = async (rewardId, rewardName, pointsRequired) => {
    if (!window.confirm(`Redeem "${rewardName}" for ${pointsRequired} points?`)) return

    try {
      const result = await redeemReward(rewardId)
      alert(`Success! ${result.message} Points remaining: ${result.points_remaining}`)
      fetchData()
    } catch (error) {
      alert(error.message)
    }
  }

  if (loading) return <div className="loading">Loading rewards...</div>

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Rewards Store</h1>
        <div className="points-display">
          <span className="points-badge">Your Points: {user?.total_points || 0}</span>
        </div>
      </div>

      <section className="section">
        <h2>Available Rewards</h2>
        <div className="rewards-grid">
          {rewards.map(reward => (
            <div key={reward.reward_id} className="card reward-card">
              <h3>{reward.name}</h3>
              <p>{reward.description}</p>
              <div className="reward-meta">
                <span className="points-cost">{reward.points_required} points</span>
                <span className="stock">Stock: {reward.available_stock}</span>
              </div>
              {reward.user_eligibility === 'eligible' ? (
                <button 
                  className="btn btn-success"
                  onClick={() => handleRedeem(reward.reward_id, reward.name, reward.points_required)}
                >
                  Redeem Now
                </button>
              ) : (
                <button className="btn btn-disabled" disabled>
                  Need {reward.points_required - (user?.total_points || 0)} more points
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Redemption History</h2>
        {history.length > 0 ? (
          <div className="history-table">
            <table>
              <thead>
                <tr>
                  <th>Reward</th>
                  <th>Points Spent</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <strong>{item.reward_name}</strong>
                      <br />
                      <small>{item.description}</small>
                    </td>
                    <td className="points-spent">{item.points_spent} points</td>
                    <td>{new Date(item.redemption_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No redemption history yet.</p>
        )}
      </section>
    </div>
  )
}

export default RewardsPage