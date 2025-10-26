// Authentication API calls
export const registerUser = async (userData) => {
  console.log('🟡 Sending registration request:', userData)
  
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  })
  
  console.log('🟡 Registration response status:', response.status)
  
  if (!response.ok) {
    const errorText = await response.text()
    console.log('🔴 Registration error response:', errorText)
    throw new Error('Registration failed - check server connection')
  }
  
  return response.json()
}

export const loginUser = async (credentials) => {
  console.log('🟡 Sending login request:', credentials)
  
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  })
  
  console.log('🟡 Login response status:', response.status)
  
  if (!response.ok) {
    const errorText = await response.text()
    console.log('🔴 Login error response:', errorText)
    throw new Error('Login failed - check server connection')
  }
  
  return response.json()
}

// Emission Factors API
export const getEmissionFactors = async () => {
  const token = localStorage.getItem('token')
  const response = await fetch('/api/emission-factors', {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error('Failed to fetch emission factors: ' + errorText)
  }
  
  const data = await response.json()
  return data.data
}

// Activities API calls
export const getActivities = async () => {
  const token = localStorage.getItem('token')
  const response = await fetch('/api/activities', {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error('Failed to fetch activities: ' + errorText)
  }
  
  const data = await response.json()
  return data.data
}

export const addActivity = async (activityData) => {
  const token = localStorage.getItem('token')
  const response = await fetch('/api/activities', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(activityData)
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error('Failed to add activity: ' + errorText)
  }
  
  return response.json()
}

// Dashboard API calls
export const getDashboardData = async () => {
  const token = localStorage.getItem('token')
  const response = await fetch('/api/dashboard', {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error('Failed to fetch dashboard data: ' + errorText)
  }
  
  const data = await response.json()
  return data.data
}

// User API calls
export const getUserProfile = async () => {
  const token = localStorage.getItem('token')
  const response = await fetch('/api/user/profile', {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error('Failed to fetch user profile: ' + errorText)
  }
  
  const data = await response.json()
  return data.data
}

// Challenges API calls
export const getChallenges = async () => {
  const token = localStorage.getItem('token')
  const response = await fetch('/api/challenges', {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error('Failed to fetch challenges: ' + errorText)
  }
  
  const data = await response.json()
  return data.data
}

export const joinChallenge = async (challengeId) => {
  const token = localStorage.getItem('token')
  const response = await fetch('/api/challenges/join', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ challenge_id: challengeId })
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error('Failed to join challenge: ' + errorText)
  }
  
  return response.json()
}

export const getUserChallenges = async () => {
  const token = localStorage.getItem('token')
  const response = await fetch('/api/challenges/user', {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error('Failed to fetch user challenges: ' + errorText)
  }
  
  const data = await response.json()
  return data.data
}

// Rewards API calls
export const getRewards = async () => {
  const token = localStorage.getItem('token')
  const response = await fetch('/api/rewards', {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error('Failed to fetch rewards: ' + errorText)
  }
  
  const data = await response.json()
  return data.data
}

export const redeemReward = async (rewardId) => {
  const token = localStorage.getItem('token')
  const response = await fetch('/api/rewards/redeem', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ reward_id: rewardId })
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error('Failed to redeem reward: ' + errorText)
  }
  
  return response.json()
}

export const getRedemptionHistory = async () => {
  const token = localStorage.getItem('token')
  const response = await fetch('/api/rewards/history', {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error('Failed to fetch redemption history: ' + errorText)
  }
  
  const data = await response.json()
  return data.data
}