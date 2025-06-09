// Export API_BASE_URL for backward compatibility
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

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

export const api = {
  // Get thoughts with pagination
  getThoughts: async (page = 1, limit = 10, retryCount = 0) => {
    const url = `${API_BASE_URL}/thoughts?page=${page}&limit=${limit}`
    console.log('Fetching thoughts from:', url)

    try {
      const response = await fetch(url)

      if (response.status === 503 && retryCount < 3) {
        console.log('API server is starting up. Retrying in 5 seconds...')
        await new Promise((resolve) => setTimeout(resolve, 5000))
        return api.getThoughts(page, limit, retryCount + 1)
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      console.log('API response data sample:', data)

      // Update logging to match actual structure
      console.log(
        'Total thoughts in response:',
        data.response?.thoughts?.length || 'unknown'
      )
      console.log(
        'Current page:',
        data.response?.pagination?.current || 'not provided'
      )
      console.log(
        'Total pages:',
        data.response?.pagination?.pages || 'not provided'
      )
      console.log(
        'Total count:',
        data.response?.pagination?.total || 'not provided'
      )

      return data
    } catch (error) {
      console.error('API fetch error:', error)
      throw error
    }
  },

  // Post a new thought
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
      const response = await fetch(`${API_BASE_URL}/thoughts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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

  // Like a thought
  likeThought: async (id, retryCount = 0) => {
    console.log('API: Liking thought:', id)
    return deduplicateRequest(`like-${id}`, async () => {
      const response = await fetch(`${API_BASE_URL}/thoughts/${id}/like`, {
        method: 'POST'
      })

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

  // Delete a thought
  deleteThought: async (id) => {
    console.log('API: Deleting thought with ID:', id)

    try {
      const response = await fetch(`${API_BASE_URL}/thoughts/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('Delete response status:', response.status)
      console.log('Delete response ok:', response.ok)

      // Check if the thought was not found
      if (response.status === 404) {
        throw new Error('Thought not found - it may have already been deleted')
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
  updateThought: async (id, updatedMessage) => {
    const response = await fetch(`${API_BASE_URL}/thoughts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: updatedMessage })
    })

    if (!response.ok) {
      throw new Error(`Failed to update thought: ${response.status}`)
    }

    return response.json()
  }
}
