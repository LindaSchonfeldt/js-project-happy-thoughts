// Export API_BASE_URL for backward compatibility
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// Simple request deduplication system
const pendingRequests = new Map()

const deduplicateRequest = async (key, requestFn) => {
  if (pendingRequests.has(key)) {
    console.log('Duplicate request detected:', key)
    return pendingRequests.get(key)
  }

  const promise = requestFn()
  pendingRequests.set(key, promise)

  try {
    const result = await promise
    return result
  } finally {
    pendingRequests.delete(key)
  }
}

// Helper function - only add auth headers if token exists
const getAuthHeaders = (requireAuth = false) => {
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json' }

  if (token || requireAuth) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return headers
}

// Simple cache mechanism
const cache = {
  data: {},
  set: function (key, data, ttl = 60000) {
    this.data[key] = {
      value: data,
      expiry: Date.now() + ttl
    }
  },
  get: function (key) {
    const item = this.data[key]
    if (!item) return null
    if (Date.now() > item.expiry) {
      delete this.data[key]
      return null
    }
    return item.value
  }
}

const fetchWithTimeout = (url, options, timeout = 10000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ])
}

// Helper function
const fetchWithRetry = async (url, options, retries = 3) => {
  let lastError

  for (let i = 0; i < retries; i++) {
    try {
      return await fetchWithTimeout(url, options)
    } catch (error) {
      console.log(`API request failed (attempt ${i + 1}/${retries})`, error)
      lastError = error

      // Only retry on network errors, not HTTP errors
      if (
        !error.message.includes('NetworkError') &&
        !error.message.includes('timeout')
      ) {
        throw error
      }

      // Wait before retrying (with increasing delay)
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
    }
  }

  throw lastError
}

export const api = {
  // Get thoughts - NO authentication required
  getThoughts: async (page = 1, limit = 10, retryCount = 0) => {
    const cacheKey = `thoughts_${page}_${limit}`
    const cachedData = cache.get(cacheKey)

    if (cachedData) {
      console.log('Using cached thoughts data')
      return cachedData
    }

    const url = `${API_BASE_URL}/thoughts?page=${page}&limit=${limit}`
    console.log('Fetching thoughts from:', url)

    try {
      const response = await fetchWithRetry(url, {
        method: 'GET',
        headers: getAuthHeaders(false)
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      // Cache the results
      if (data.success) {
        cache.set(cacheKey, data, 30000) // Cache for 30 seconds
      }

      return data
    } catch (error) {
      console.error('API fetch error:', error)
      throw error
    }
  },

  // Post thought - NO authentication required (anonymous posting)
  postThought: async (message, retryCount = 0) => {
    console.log('API postThought called with:', {
      message,
      type: typeof message,
      length: message?.length
    })

    // Validate message
    if (
      !message ||
      typeof message !== 'string' ||
      message.trim().length === 0
    ) {
      throw new Error('Message is required and must be a string')
    }

    return deduplicateRequest(`post-${message}`, async () => {
      console.log('API: Posting thought:', message)
      const response = await fetchWithRetry(`${API_BASE_URL}/thoughts`, {
        method: 'POST',
        headers: getAuthHeaders(false), // ← No auth required
        body: JSON.stringify({ message })
      })

      if (response.status === 503 && retryCount < 3) {
        console.log('API server is starting up. Retrying in 5 seconds...')
        await new Promise((resolve) => setTimeout(resolve, 5000))
        return api.postThought(message, retryCount + 1)
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(
          data.message || `Failed to post thought: ${response.status}`
        )
      }

      return await response.json()
    })
  },

  // Like thought - NO authentication required
  likeThought: async (id, retryCount = 0) => {
    console.log('API: Liking thought:', id)
    return deduplicateRequest(`like-${id}`, async () => {
      const response = await fetchWithRetry(
        `${API_BASE_URL}/thoughts/${id}/like`,
        {
          method: 'POST',
          headers: getAuthHeaders(false) // ← No auth required
        }
      )

      if (response.status === 503 && retryCount < 3) {
        console.log('API server is starting up. Retrying in 5 seconds...')
        await new Promise((resolve) => setTimeout(resolve, 5000))
        return api.likeThought(id, retryCount + 1)
      }

      if (!response.ok) {
        const err = await response
          .json()
          .catch(() => ({ message: `HTTP ${response.status}` }))
        throw new Error(err.message || `Failed to like (${response.status})`)
      }
      return response.json()
    })
  },

  // Delete thought - REQUIRES authentication
  deleteThought: async (thoughtId) => {
    console.log('API: Deleting thought with ID:', thoughtId)

    try {
      const token = localStorage.getItem('token')

      if (!token) {
        throw new Error('You must be logged in to delete thoughts')
      }

      const response = await fetchWithRetry(
        `${API_BASE_URL}/thoughts/${thoughtId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}` // Add this Authorization header
          }
        }
      )

      // Check if the thought was not found
      if (response.status === 404) {
        throw new Error('Thought not found - it may have already been deleted')
      }

      if (response.status === 401) {
        throw new Error('You must be logged in to delete thoughts')
      }

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Delete error response:', errorData)
        throw new Error(
          `Failed to delete thought: ${response.status} - ${errorData}`
        )
      }

      // Some APIs return empty response for successful delete
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      } else {
        return { success: true, message: 'Thought deleted successfully' }
      }
    } catch (error) {
      console.error('Delete thought error:', error)
      throw error
    }
  },

  // Update an existing thought
  updateThought: async (thoughtId, message) => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token')

      if (!token) {
        throw new Error('You must be logged in to update thoughts')
      }

      const response = await fetchWithRetry(
        `${API_BASE_URL}/thoughts/${thoughtId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ message })
        }
      )

      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token') // Clear token
        throw new Error('Your session has expired. Please log in again')
      }

      if (!response.ok) {
        throw new Error(`Failed to update thought: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating thought:', error)
      throw error
    }
  },

  loginUser: async (credentials) => {
    console.log('API: Logging in user:', credentials.username)

    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Login failed: ${response.status}`)
      }

      const data = await response.json()
      console.log('Login successful:', data)
      return data
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  },

  signupUser: async (userData) => {
    console.log('API: Signing up user:', userData.username)

    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/users/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.message || `Signup failed: ${response.status}`
        )
      }

      const data = await response.json()
      console.log('Signup successful:', data)
      return data
    } catch (error) {
      console.error('Signup error:', error)
      throw error
    }
  },

  // Check API connection
  isConnected: async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      await fetch(`${API_BASE_URL}/health`, {
        method: 'HEAD',
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      return true
    } catch (e) {
      return false
    }
  },

  // Get liked thoughts - REQUIRES authentication
  getLikedThoughts: async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetchWithRetry(`${API_BASE_URL}/thoughts/liked`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch liked thoughts: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching liked thoughts:', error)
      throw error
    }
  }
}
