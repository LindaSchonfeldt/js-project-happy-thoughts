import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react'

import { api } from '../api/api'

// Create a utility function instead of importing the hook
const getCurrentUserIdFromToken = () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return null

    // Basic JWT decode
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )

    const decoded = JSON.parse(jsonPayload)
    return decoded.userId || decoded.id || decoded.sub
  } catch (error) {
    console.error('Error decoding token:', error)
    return null
  }
}

const ThoughtsContext = createContext()

export const ThoughtsProvider = ({ children }) => {
  const [thoughts, setThoughts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [notification, setNotification] = useState(null)

  // Use the utility function directly instead of the hook
  const getCurrentUserId = getCurrentUserIdFromToken

  const fetchThoughts = useCallback(
    async (page = 1) => {
      setLoading(true)
      setError(null)
      try {
        // api.getThoughts returns a normalized response with data and totalPages directly
        const result = await api.getThoughts(page)

        if (!result.success)
          throw new Error(result.message || 'Failed to fetch thoughts')

        // Access data directly from the normalized response
        const me = getCurrentUserId()
        const sorted = result.data
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .map((t) => ({ ...t, isOwn: t.userId === me }))

        setThoughts(sorted)
        setCurrentPage(page) // Use the page we requested
        setTotalPages(result.totalPages) // Get totalPages directly from normalized response

        console.log('Pagination updated:', {
          currentPage: page,
          totalPages: result.totalPages
        })
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    },
    [getCurrentUserId]
  )

  // Add deleteThought function
  const deleteThought = async (thoughtId) => {
    try {
      const originalThoughts = [...thoughts]
      setThoughts((prev) => prev.filter((t) => t._id !== thoughtId))

      const result = await api.deleteThought(thoughtId)

      if (!result.success) {
        // Restore the original thoughts if deletion fails
        setThoughts(originalThoughts)

        // Show notification
        setNotification({
          type: 'error',
          message: result.message || 'Failed to delete thought'
        })

        setTimeout(() => setNotification(null), 3000)
        return false
      }

      // Check for server errors that were masked as success
      if (result.serverError) {
        // Log additional details for debugging
        console.log(
          'Server error details:',
          result.errorDetails || 'No details available'
        )

        setNotification({
          type: 'warning',
          message: 'Thought removed from view, but server reported an error'
        })
        setTimeout(() => setNotification(null), 3000)
        return true // Still return true since UI removal was successful
      }

      // Show success notification
      setNotification({
        type: 'success',
        message: 'Thought successfully deleted!'
      })
      setTimeout(() => setNotification(null), 3000)

      return true
    } catch (error) {
      console.error('Error deleting thought:', error)
      setThoughts(originalThoughts) // Restore original thoughts

      setNotification({
        type: 'error',
        message:
          'Could not delete thought. You may only delete your own thoughts.'
      })
      setTimeout(() => setNotification(null), 3000)
      return false
    }
  }

  // First, add the createThought function (if not already there)
  const createThought = async (message) => {
    try {
      const result = await api.postThought(message)

      if (result.success) {
        const newThought = result.response
        // Add the new thought to the beginning of the array
        setThoughts((prev) => [newThought, ...prev])

        // Show success notification
        setNotification({
          type: 'success',
          message: 'Thought posted successfully!'
        })
        setTimeout(() => setNotification(null), 3000)

        return result
      } else {
        setNotification({
          type: 'error',
          message: result.message || 'Failed to post thought'
        })
        setTimeout(() => setNotification(null), 3000)
        return result
      }
    } catch (error) {
      console.error('Error creating thought:', error)
      setNotification({
        type: 'error',
        message: 'Error posting thought'
      })
      setTimeout(() => setNotification(null), 3000)
      throw error
    }
  }

  // First, add the updateThought function definition if not already there
  const updateThought = async (thoughtId, message) => {
    try {
      const result = await api.updateThought(thoughtId, message)

      if (result.success) {
        // Update the thought in the list
        setThoughts((prev) =>
          prev.map((thought) =>
            thought._id === thoughtId ? { ...thought, message } : thought
          )
        )

        // Show success notification
        setNotification({
          type: 'success',
          message: 'Thought updated successfully!'
        })
        setTimeout(() => setNotification(null), 3000)

        return result
      } else {
        setNotification({
          type: 'error',
          message: result.message || 'Failed to update thought'
        })
        setTimeout(() => setNotification(null), 3000)
        return result
      }
    } catch (error) {
      console.error('Error updating thought:', error)
      setNotification({
        type: 'error',
        message: 'Could not update thought'
      })
      setTimeout(() => setNotification(null), 3000)
      throw error
    }
  }

  useEffect(() => {
    fetchThoughts(currentPage)
  }, [currentPage])

  return (
    <ThoughtsContext.Provider
      value={{
        thoughts,
        loading,
        error,
        currentPage,
        totalPages,
        fetchThoughts,
        setCurrentPage,
        deleteThought,
        notification,
        setNotification,
        createThought,
        updateThought,
        getCurrentUserId
      }}
    >
      {children}
    </ThoughtsContext.Provider>
  )
}

export const useThoughts = () => {
  const ctx = useContext(ThoughtsContext)
  if (!ctx) throw new Error('useThoughts must be used within ThoughtsProvider')
  return ctx
}
