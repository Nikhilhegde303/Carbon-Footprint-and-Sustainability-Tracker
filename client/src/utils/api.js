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
    const text = await response.text()
    throw new Error('Failed to load challenges: ' + text)
  }

  const data = await response.json()
  return data // expected { available:[], mine:[] }
}

export const joinChallenge = async (challengeId) => {
  const token = localStorage.getItem('token')
  const response = await fetch('/api/challenges/join', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ challenge_id: challengeId })
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Failed to join challenge')
  }

  return response.json()
}

export const leaveChallenge = async (challengeId) => {
  const token = localStorage.getItem('token')
  const response = await fetch(`/api/challenges/join/${challengeId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Failed to leave challenge')
  }

  return response.json()
}

export const getUserPoints = async () => {
  const token = localStorage.getItem('token');

  const response = await fetch('/api/user/points', {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch user points');
  }

  return Number(data.points || 0);
};



// Rewards API calls (fixed & debug-friendly)
export const getRewards = async () => {
  const token = localStorage.getItem('token')
  const url = '/api/rewards'

  try {
    console.log('🟢 Fetching rewards from', url)
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('🟡 Rewards response status:', response.status)

    // Try parsing JSON safely
    let data
    try {
      data = await response.json()
    } catch (err) {
      const text = await response.text()
      console.error('🔴 Rewards response not JSON:', text)
      throw new Error('Server returned invalid response for rewards.')
    }

    console.log('🟢 Rewards response payload:', data)

    // Handle non-200 responses
    if (!response.ok) {
      const message = data?.message || `Failed to load rewards (HTTP ${response.status})`
      throw new Error(message)
    }

    // Handle backend structure like { success: true, data: [...] }
    if (!data || (data.success === false)) {
      throw new Error(data?.message || 'Unexpected rewards response structure')
    }

    // If backend sends rewards array directly (no .data)
    return Array.isArray(data.data) ? data.data : data
  } catch (err) {
    console.error('❌ getRewards error:', err)
    throw new Error(err.message || 'Failed to load rewards.')
  }
}

export const redeemReward = async (rewardId) => {
  const token = localStorage.getItem('token')
  const url = '/api/rewards/redeem'

  try {
    console.log('🟢 Redeeming reward:', rewardId)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ reward_id: rewardId })
    })

    console.log('🟡 Redeem response status:', response.status)

    let data
    try {
      data = await response.json()
    } catch (err) {
      const text = await response.text()
      console.error('🔴 Redeem response not JSON:', text)
      throw new Error('Server returned invalid response for redeem.')
    }

    console.log('🟢 Redeem payload:', data)

    if (!response.ok) {
      const message = data?.message || `Failed to redeem (HTTP ${response.status})`
      throw new Error(message)
    }

    if (!data || (data.success === false)) {
      throw new Error(data?.message || 'Redemption failed.')
    }

    return data
  } catch (err) {
    console.error('❌ redeemReward error:', err)
    throw new Error(err.message || 'Redemption failed.')
  }
}

export const getRedemptionHistory = async () => {
  const token = localStorage.getItem('token')
  const url = '/api/rewards/history'

  try {
    console.log('🟢 Fetching redemption history...')
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('🟡 History response status:', response.status)

    const data = await response.json().catch(async () => {
      const text = await response.text()
      console.error('🔴 History not JSON:', text)
      throw new Error('Invalid response for redemption history.')
    })

    console.log('🟢 History payload:', data)

    if (!response.ok) {
      throw new Error(data?.message || `Failed to fetch history (HTTP ${response.status})`)
    }

    if (!data || (data.success === false)) {
      throw new Error(data?.message || 'Unexpected history response structure')
    }

    return Array.isArray(data.data) ? data.data : data
  } catch (err) {
    console.error('❌ getRedemptionHistory error:', err)
    throw new Error(err.message || 'Failed to fetch redemption history.')
  }
}

