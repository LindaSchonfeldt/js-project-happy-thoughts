export const API_BASE_URL =
  process.env.VITE_API_BASE_URL ||
  'https://happy-thoughts-api-yn3p.onrender.com'

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
  getThoughts: async (page = 1, limit = 10) => {
    const response = await fetch(
      `${API_BASE_URL}/thoughts?page=${page}&limit=${limit}`
    )
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    return response.json()
  },

  // Post a new thought
  postThought: async (message) => {
    return deduplicateRequest(`post-${message}`, async () => {
      console.log('API: Posting thought:', message)
      const response = await fetch(`${API_BASE_URL}/thoughts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(
          data.message || `Failed to post thought: ${response.status}`
        )
      }

      return await response.json()
    })
  },

  // Delete a thought
  /*   deleteThought: async (id) => {
    console.log('API: Deleting thought:', id)
    const response = await fetch(`${API_BASE_URL}/thoughts/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) {
      throw new Error(`Failed to delete thought: ${response.status}`)
    }
    return response.json()
  }, */

  // Like a thought
  likeThought: async (id) => {
    console.log('API: Liking thought:', id)
    return deduplicateRequest(`like-${id}`, async () => {
      const res = await fetch(`${API_BASE_URL}/thoughts/${id}/like`, {
        method: 'POST'
      })
      if (!res.ok) {
        // try to extract server error message
        const err = await res
          .json()
          .catch(() => ({ message: `HTTP ${res.status}` }))
        throw new Error(err.message || `Failed to like (${res.status})`)
      }
      return res.json()
    })
  }
}
