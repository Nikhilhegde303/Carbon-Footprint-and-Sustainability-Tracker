const API_BASE_URL = 'http://localhost:5000/api'

// Generic API call function
async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('token')
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    ...options
  }

  if (options.body) {
    config.body = JSON.stringify(options.body)
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong')
  }

  return data
}

// Auth APIs
export async function registerUser(userData) {
  return apiCall('/auth/register', {
    method: 'POST',
    body: userData
  })
}

export async function loginUser(credentials) {
  return apiCall('/auth/login', {
    method: 'POST',
    body: credentials
  })
}

// User APIs
export async function getUserProfile() {
  return apiCall('/user/profile')
}

export default apiCall