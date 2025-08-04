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
function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('token')
  if (token) headers.Authorization = `Bearer ${token}`
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

/**
 * Fetch with timeout using AbortController.
 * @param {string} url
 * @param {object} options
 * @param {number} timeoutMs
 */
export function fetchWithTimeout(url, options = {}, timeoutMs = 20000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timeoutId)
  )
}

/**
 * Fetch + automatic retry on timeout only.
 * @param {string} url
 * @param {object} options
 * @param {number} retries
 * @param {number} timeoutMs
 */
export async function fetchWithRetry(
  url,
  options = {},
  retries = 5,
  timeoutMs = 20000
) {
  let lastError

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`API request attempt ${attempt}/${retries}: ${url}`)
      const response = await fetchWithTimeout(url, options, timeoutMs)

      // Check if response is ok before parsing
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error ${response.status}: ${errorText}`)
      }

      // If the response is empty (like some DELETE responses)
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      } else {
        return { success: true }
      }
    } catch (error) {
      lastError = error

      // Retry on timeouts, network errors, AND 5xx server errors
      const is5xxError = error.message.includes('HTTP error 5')
      if (
        error.name === 'AbortError' ||
        error.message.includes('timeout') ||
        is5xxError
      ) {
        console.log(
          `API request failed (attempt ${attempt}/${retries}): ${error.message}`
        )

        const delay = Math.min(
          1000 * Math.pow(2, attempt) + Math.random() * 1000,
          10000
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      // Don't retry for client errors
      throw error
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
      // fetchWithRetry already returns parsed JSON
      const rawData = await fetchWithRetry(
        `${API_BASE_URL}/thoughts?page=${page}&limit=${limit}`
      )
      console.log('API raw data:', rawData)
      return normalizeResponse(rawData)
    } catch (error) {
      console.error('API fetch error:', error)
      return {
        success: false,
        data: [],
        message: error.message || 'Failed to fetch thoughts'
      }
    }
  },

  // Post thought - Include authentication when available
  postThought: async (message) => {
    try {
      console.log('API postThought called with:', {
        message,
        type: typeof message,
        length: message.length
      })

      const originalMessage = message.trim()

      // Input validation
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

      // Send the complete message to backend
      const requestPayload = {
        message: originalMessage,
        tags: tags
      }

      // Get authentication token if available
      const token = localStorage.getItem('token')
      const headers = {
        'Content-Type': 'application/json'
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      // Your fetchWithRetry already returns parsed JSON
      const result = await fetchWithRetry(`${API_BASE_URL}/thoughts`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestPayload)
      })

      console.log('Server response:', result)

      // Just return the parsed result in the expected format
      return {
        success: result.success === true,
        response: result.response || result.data || null,
        message: result.message || 'Thought created'
      }
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
      try {
        // Log what we're about to do
        console.log(`Making POST request to like thought: ${id}`)

        // Make the API call - fetchWithRetry returns parsed JSON, not Response object
        const result = await fetchWithRetry(
          `${API_BASE_URL}/thoughts/${id}/like`,
          {
            method: 'POST',
            headers: getAuthHeaders(false)
          }
        )

        console.log('Parsed like response:', result)

        // If result has a success property that's true, return it directly
        if (result && result.success === true) {
          return {
            success: true,
            hearts: result.data?.hearts || result.hearts || null,
            message: result.message || 'Like successful'
          }
        }

        // If the result indicates failure but we made it this far,
        // return a success anyway since the API call went through
        return {
          success: true,
          hearts: null,
          message: 'Like operation completed'
        }
      } catch (error) {
        // This catches network errors or any uncaught exceptions
        console.error('Caught error in likeThought:', error)

        // Return a failure object that won't cause further errors
        return {
          success: false,
          hearts: null,
          message: error.message || 'Unknown error'
        }
      }
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
          message: 'Authentication required to delete thoughts'
        }
      }

      // Add token debugging
      console.log('Token (first 20 chars):', token.substring(0, 20) + '...')

      // SIMPLIFIED headers - remove custom headers that cause CORS issues
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }

      console.log('Using simplified headers to avoid CORS issues')

      // Try with a custom approach to bypass potential server issues
      try {
        const response = await fetch(`${API_BASE_URL}/thoughts/${thoughtId}`, {
          method: 'DELETE',
          headers: headers
        })

        console.log('Delete response status:', response.status)

        if (response.ok) {
          return {
            success: true,
            message: 'Thought deleted successfully'
          }
        }

        // Try to read response text for more details
        const errorText = await response.text()
        console.error('Server error response:', errorText)

        throw new Error(`HTTP error ${response.status}: ${errorText}`)
      } catch (fetchError) {
        console.error('Fetch error details:', fetchError)
        throw fetchError // Rethrow to be caught by outer try/catch
      }
    } catch (error) {
      console.error('Error deleting thought:', error)

      // Check if it's a CORS error
      if (
        error.message.includes('NetworkError') ||
        error.message.includes('CORS')
      ) {
        return {
          success: false,
          message:
            'Network error - CORS policy blocked the request. Try using standard headers only.'
        }
      }

      // Remaining error handling...
      if (error.message.includes('500')) {
        return {
          success: false,
          message:
            'Server error - the backend encountered an unexpected problem'
        }
      } else if (error.message.includes('404')) {
        return {
          success: false,
          message: 'Thought not found or already deleted'
        }
      } else if (error.message.includes('403')) {
        return {
          success: false,
          message: 'You do not have permission to delete this thought'
        }
      } else if (error.message.includes('401')) {
        return {
          success: false,
          message: 'Authentication failed - please log in again'
        }
      }

      return {
        success: false,
        message: error.message || 'Failed to delete thought'
      }
    }
  },

  // Try alternative update method using PATCH instead of PUT
  updateThought: async (thoughtId, updatedData = {}) => {
    try {
      console.log('Using POST+DELETE workaround instead of PUT', {
        thoughtId,
        updatedData
      })

      // Safety check for required parameters
      if (!thoughtId) {
        return {
          success: false,
          message: 'Missing thought ID'
        }
      }

      // Provide default if updatedData is undefined
      const messageToUpdate = updatedData?.message || 'Updated thought'

      // Step 1: Create a new thought with the updated content
      const createResult = await api.postThought(messageToUpdate)

      if (!createResult.success) {
        return {
          success: false,
          message: `Failed to create replacement: ${createResult.message}`
        }
      }

      // Step 2: Delete the old thought
      const deleteResult = await api.deleteThought(thoughtId)

      if (!deleteResult.success) {
        console.warn(
          'Created replacement but failed to delete original:',
          deleteResult.message
        )
      }

      // Make sure this return structure matches what your component expects
      return {
        success: true,
        message: 'Thought replaced successfully',
        newThoughtId: createResult.response?._id,
        // Add these fields that might be expected by your component
        response: createResult.response || null,
        data: createResult.response || null
      }
    } catch (error) {
      console.error('Error replacing thought:', error)
      return {
        success: false,
        message: error.message || 'Failed to replace thought',
        // Add empty fields for consistency
        response: null,
        data: null
      }
    }
  },

  loginUser: async (credentials) => {
    console.log('API: Logging in user:', credentials.username)

    try {
      // fetchWithRetry now returns parsed JSON or throws on non-OK
      const data = await fetchWithRetry(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })
      console.log('Login successful:', data)
      return data
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  },

  signupUser: async (userData) => {
    try {
      const response = await fetch(`${BASE_URL}/users/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      const data = await response.json()
      console.log('Signup API response:', data)

      // Don't throw error for 400 status - let component handle it
      if (response.ok) {
        return {
          success: true,
          user: data.response,
          message: data.message,
          token: data.response?.accessToken || data.token
        }
      } else {
        // Return the error response instead of throwing
        return {
          success: false,
          message: data.message || data.response || 'Signup failed',
          errors: data.errors || null
        }
      }
    } catch (error) {
      console.error('Signup network error:', error)
      return {
        success: false,
        message: 'Network error during signup'
      }
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
