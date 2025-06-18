// Import the emoji utils
import {
  encodeEmojis,
  decodeEmojis,
  getEmojiPositions,
  storeThoughtWithEmoji
} from '../utils/emojiUtils'

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

// Extracts hashtags from a message string
const extractHashtags = (message) => {
  const hashtagRegex = /#(\w+)/g
  const matches = message.match(hashtagRegex)

  if (!matches) return []

  return matches.map((tag) => tag.slice(1)) // Remove the # character
}

const fetchWithTimeout = (url, options, timeout = 30000) => {
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

// Normalize response function
const normalizeResponse = (rawData) => {
  // Create a normalized response
  let result = { success: false, data: [] }

  // Handle the observed response format:
  // { success: true, response: {...}, message: "All thoughts were successfully fetched" }
  if (rawData && rawData.success) {
    if (rawData.response) {
      // Check if response contains thoughts array or is the thoughts array
      if (
        rawData.response.thoughts &&
        Array.isArray(rawData.response.thoughts)
      ) {
        result = {
          success: true,
          data: rawData.response.thoughts,
          totalPages: rawData.response.pagination?.pages || 1
        }
      } else if (Array.isArray(rawData.response)) {
        result = {
          success: true,
          data: rawData.response,
          totalPages: 1
        }
      } else {
        // If response is a single thought or object with thoughts
        console.log('Response structure:', rawData.response)
        const thoughtsArray =
          Array.isArray(rawData.response) || rawData.response.data || []
        result = {
          success: true,
          data: thoughtsArray,
          totalPages: rawData.response.pagination?.pages || 1
        }
      }
    } else if (rawData.data && Array.isArray(rawData.data)) {
      // Standard format with data property
      result = {
        success: true,
        data: rawData.data,
        totalPages: rawData.totalPages || 1
      }
    }
  } else if (Array.isArray(rawData)) {
    // Direct array response
    result = {
      success: true,
      data: rawData,
      totalPages: 1
    }
  } else {
    console.error('Unexpected API response format:', rawData)

    // Try to extract any possible data
    const possibleData =
      rawData.response?.thoughts ||
      rawData.response?.data ||
      rawData.response ||
      rawData.data ||
      []

    result = {
      success: false,
      data: Array.isArray(possibleData) ? possibleData : [],
      message: rawData?.message || 'Unexpected response format'
    }
  }

  console.log('Normalized response:', result)

  return result
}

export const api = {
  // Get thoughts - NO authentication required
  getThoughts: async (page = 1, limit = 10) => {
    try {
      const response = await fetchWithRetry(
        `${API_BASE_URL}/thoughts?page=${page}&limit=${limit}`
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch thoughts: ${response.status}`)
      }

      const result = await response.json()
      console.log('API response with potential theme tags:', result)
      return normalizeResponse(result)
    } catch (error) {
      console.error('API fetch error:', error)
      return {
        success: false,
        data: [],
        message: error.message
      }
    }
  },

  // Post thought - NO authentication required (anonymous posting)
  postThought: async (message) => {
    try {
      console.log('API postThought called with:', {
        message,
        type: typeof message,
        length: message.length
      })

      const originalMessage = message.trim()

      if (originalMessage.length < 5) {
        return {
          success: false,
          response: null,
          message: 'Message must be at least 5 characters'
        }
      }

      if (originalMessage.length > 140) {
        return {
          success: false,
          response: null,
          message: 'Message must not exceed 140 characters'
        }
      }

      // Extract hashtags using frontend logic (for immediate display)
      const hashtagRegex = /#(\w+)/g
      const matches = originalMessage.match(hashtagRegex)
      const tags = matches ? matches.map((tag) => tag.slice(1)) : []

      // Send the complete message to backend - backend will use ThoughtsModel.identifyTags()
      const requestPayload = {
        message: originalMessage,
        tags: tags
        // No need to send themeTags - backend will generate them
      }

      // Add diagnostic information
      console.log('Request payload:', JSON.stringify(requestPayload))

      // Try a simple fetch without any of our custom logic first
      const response = await fetch(`${API_BASE_URL}/thoughts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      })

      // Log detailed response info
      console.log('Server response status:', response.status)

      const responseBody = await response.text()
      console.log('Server response body:', responseBody)

      let jsonData
      try {
        jsonData = JSON.parse(responseBody)

        // Return in a consistent format that matches what your app expects
        return {
          success: jsonData.success,
          response: jsonData.response, // ← use `response` here
          message: jsonData.message
        }
      } catch (e) {
        console.log('Response is not valid JSON')
        // Handle non-JSON response
      }

      if (!response.ok) {
        const errorMessage =
          jsonData?.message || 'Server error - please try again later'

        throw new Error(errorMessage)
      }

      return (
        jsonData || {
          success: false,
          response: null,
          message: 'Invalid server response'
        }
      )
    } catch (error) {
      console.error('Error creating thought:', error)
      return {
        success: false,
        response: null,
        message: error.message || 'An unexpected error occurred'
      }
    }
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
        return {
          success: false,
          response: null,
          message: 'Authentication required to delete thoughts'
        }
      }

      const response = await fetchWithRetry(
        `${API_BASE_URL}/thoughts/${thoughtId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      )

      // Handle 403 Forbidden specifically
      if (response.status === 403) {
        const data = await response.json().catch(() => ({}))
        return {
          success: false,
          response: null,
          message: data.message || 'Not authorized to delete this thought'
        }
      }

      // Handle 500 server errors
      if (response.status === 500) {
        console.warn('Server error when deleting thought:', thoughtId)

        // Try to get error details if available
        const errorData = await response
          .text()
          .catch(() => 'Unknown server error')
        console.error('Server error details:', errorData)

        // Despite the server error, we'll tell the UI the delete succeeded
        // This provides a better user experience when the server is having issues
        return {
          success: true, // Return success even though server had an error
          response: null,
          message: 'Thought was deleted from your view'
        }
      }

      if (!response.ok) {
        throw new Error(`Failed to delete thought: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error deleting thought:', error)

      // For network errors or other issues, still remove from UI
      return {
        success: true, // Return success to update UI
        response: null,
        message:
          'Thought was removed from your view, but there might be a sync issue'
      }
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
        return {
          success: false,
          data: [],
          message: 'Not authenticated'
        }
      }

      const response = await fetchWithRetry(
        `${API_BASE_URL}/users/liked-thoughts`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (!response.ok) {
        if (response.status === 401) {
          return {
            success: false,
            data: [],
            message: 'Not authenticated'
          }
        }
        throw new Error(`Failed to fetch liked thoughts: ${response.status}`)
      }

      const responseData = await response.json()

      // Simply pass through the backend response structure
      return {
        success: responseData.success,
        data: responseData.data, // Keep data as data
        message: responseData.message
      }
    } catch (error) {
      console.error('Error fetching liked thoughts:', error)
      return {
        success: false,
        data: [], // Use data instead of response.thoughts
        message: error.message || 'An unexpected error occurred'
      }
    }
  }
}
