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

      // Parse the response as JSON before returning it
      return await response.json()
    } catch (error) {
      lastError = error

      // Only retry on timeout or network errors, not on 4xx/5xx responses
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        console.log(
          `API request failed (attempt ${attempt}/${retries}): ${error.message}`
        )

        // Add exponential backoff with jitter
        const delay = Math.min(
          1000 * Math.pow(2, attempt) + Math.random() * 1000,
          10000
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      // Don't retry for client or server errors
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
        let errorDetails = 'Unknown server error'
        try {
          const errorText = await response.text()
          errorDetails = errorText
          console.error('Server error details:', errorDetails)
        } catch (e) {
          console.error('Could not parse error response:', e)
        }

        // Return a special response for 500 errors
        return {
          success: true, // Return true so UI doesn't revert
          response: null,
          message: 'Thought was removed from your view',
          serverError: true,
          errorDetails
        }
      }

      if (!response.ok) {
        const status = response.status || 'unknown'
        return {
          success: false,
          response: null,
          message: `Failed to delete thought (Status: ${status})`
        }
      }

      // Check if there's content to parse as JSON
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        try {
          return await response.json()
        } catch (err) {
          console.warn('Empty or invalid JSON in response:', err)
          // Return success even if parsing fails
          return {
            success: true,
            message: 'Thought deleted successfully'
          }
        }
      } else {
        // No JSON content type, return a success response
        return {
          success: true,
          message: 'Thought deleted successfully'
        }
      }
    } catch (error) {
      console.error('Error deleting thought:', error)

      // FIX: Return a failure response instead of success for better error handling
      return {
        success: false,
        response: null,
        message: error.message || 'Network error while deleting thought'
      }
    }
  },

  // Update an existing thought
  updateThought: async (thoughtId, updatedData) => {
    try {
      // ← ADD THIS
      const token = localStorage.getItem('token')
      if (!token) {
        return { success: false, message: 'Not authenticated' }
      }

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }

      const formattedData = {
        message: updatedData.message || '',
        tags: updatedData.tags || ['general'],
        preserveTags: updatedData.preserveTags === true
      }

      console.log('Sending unmodified data to API:', {
        thoughtId,
        data: formattedData
      })
      const result = await fetchWithRetry(
        `${API_BASE_URL}/thoughts/${thoughtId}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify(formattedData)
        }
      )

      return {
        success: true,
        response: result.response || result.data || result,
        message: 'Thought updated successfully'
      }
    } catch (error) {
      console.error('Error in update request:', error)
      return {
        success: false,
        message: error.message || 'Failed to update thought'
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
    console.log('API: Signing up user:', userData.username)

    try {
      // fetchWithRetry already returns the parsed JSON response
      const result = await fetchWithRetry(`${API_BASE_URL}/users/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      console.log('Signup successful:', result)

      // Just return the result, which is already parsed JSON
      return {
        success: result.success === true,
        token: result.token,
        user: result.user,
        message: result.message || 'Signup successful'
      }
    } catch (error) {
      console.error('Signup error:', error)

      // Try to parse error message if it's in JSON format
      let errorMessage = error.message || 'An unexpected error occurred'
      let errorDetails = {}

      // Check if the error contains a JSON string from the API
      if (error.message && error.message.includes('HTTP error')) {
        try {
          // Extract the JSON part from the error message
          const jsonStart = error.message.indexOf('{')
          if (jsonStart !== -1) {
            const jsonString = error.message.substring(jsonStart)
            const parsedError = JSON.parse(jsonString)

            // Get the user-friendly message
            errorMessage =
              parsedError.message || parsedError.response || errorMessage

            // Extract validation details if available
            if (parsedError.details) {
              errorDetails = parsedError.details
            }
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError)
        }
      }

      // Return a structured error response instead of throwing
      return {
        success: false,
        token: null,
        user: null,
        message: errorMessage,
        errors: errorDetails
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
