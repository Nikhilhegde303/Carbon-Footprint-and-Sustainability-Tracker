import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getChallenges, joinChallenge, getUserChallenges } from '../utils/api.js'
import './ChallengesPage.css'

const ChallengesPage = () => {
  const { user } = useAuth()
  const [challenges, setChallenges] = useState([])
  const [userChallenges, setUserChallenges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [allChallenges, myChallenges] = await Promise.all([
        getChallenges(),
        getUserChallenges()
      ])
      setChallenges(allChallenges)
      setUserChallenges(myChallenges)
    } catch (error) {
      console.error('Error fetching challenges:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinChallenge = async (challengeId, challengeName) => {
    try {
      await joinChallenge(challengeId)
      alert(`Successfully joined "${challengeName}" challenge!`)
      fetchData()
    } catch (error) {
      alert(error.message)
    }
  }

  if (loading) return <div className="loading">Loading challenges...</div>

  return (
    <div className="page-container">
      <h1>Carbon Reduction Challenges</h1>
      
      <section className="section">
        <h2>My Active Challenges</h2>
        <div className="challenges-grid">
          {userChallenges.map(challenge => (
            <div key={challenge.challenge_id} className="card active-challenge">
              <h3>{challenge.challenge_name}</h3>
              <p>{challenge.description}</p>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${Math.min((challenge.total_emission_saved / challenge.target_reduction) * 100, 100)}%` 
                  }}
                ></div>
              </div>
              <p>Progress: {challenge.total_emission_saved?.toFixed(2) || 0}kg / {challenge.target_reduction}kg CO₂ reduced</p>
              <small>Joined: {new Date(challenge.joined_at).toLocaleDateString()}</small>
            </div>
          ))}
          {userChallenges.length === 0 && (
            <p>You haven't joined any challenges yet.</p>
          )}
        </div>
      </section>

      <section className="section">
        <h2>Available Challenges</h2>
        <div className="challenges-grid">
          {challenges.map(challenge => (
            <div key={challenge.challenge_id} className="card">
              <h3>{challenge.challenge_name}</h3>
              <p>{challenge.description}</p>
              <div className="challenge-meta">
                <span>🎯 Target: {challenge.target_reduction}kg CO₂</span>
                <span>🏆 Reward: {challenge.reward_points} points</span>
                <span>👥 Participants: {challenge.participant_count}</span>
                <span>By: {challenge.creator_name}</span>
              </div>
              {challenge.user_joined ? (
                <button className="btn btn-disabled" disabled>Already Joined</button>
              ) : (
                <button 
                  className="btn btn-primary"
                  onClick={() => handleJoinChallenge(challenge.challenge_id, challenge.challenge_name)}
                >
                  Join Challenge
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default ChallengesPage