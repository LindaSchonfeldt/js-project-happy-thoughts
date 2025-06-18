import { useState, useEffect, createContext, useContext } from 'react'
import { api } from '../api/api'
import useThoughtAuthorization from '../hooks/useThoughtAuthorization'
import { jwtDecode } from 'jwt-decode'

const ThoughtsContext = createContext()

export const ThoughtsProvider = ({ children }) => {
  const [thoughts, setThoughts] = useState([])
  const [likedThoughts, setLikedThoughts] = useState([])
  const [loading, setLoading] = useState(true)
  const [likedLoading, setLikedLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [newThoughtId, setNewThoughtId] = useState(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Add a cache timestamp to track when data was last fetched
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState(0)
  const CACHE_TTL = 60000 // Cache time-to-live (1 minute)

  // Get all thoughts
  const fetchThoughts = async (pageNum = 1, forceRefresh = false) => {
    console.log(
      'Fetching thoughts, page:',
      pageNum,
      'forceRefresh:',
      forceRefresh
    )

    try {
      setLoading(true)

      const result = await api.getThoughts(pageNum)

      if (result && result.success) {
        const fetchedThoughts = result.data || []

        console.log(
          'Fetched thoughts with backend theme tags:',
          fetchedThoughts
        )

        // Process thoughts but preserve backend-generated themeTags
        const enhancedThoughts = fetchedThoughts.map((thought) => {
          // Extract theme tags that came from the backend
          const themeTags = thought.themeTags || []

          console.log(`Thought ${thought._id}: backend theme tags =`, themeTags)

          // Get current user ID
          const { getCurrentUserId } = useThoughtAuthorization()
          const currentUserId = getCurrentUserId()

          // We need to track which thoughts were created by this user
          // Option 1: Use local storage to track created thought IDs
          const userThoughtIds = JSON.parse(
            localStorage.getItem('userCreatedThoughts') || '[]'
          )

          // Option 2: Try to identify which thoughts might be owned by the current user
          // For example, any thoughts created in the last hour while the user was logged in
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

          // Process thoughts to add userId where appropriate
          return {
            ...thought,
            userId: currentUserId, // Explicitly set the user ID
            themeTags // Keep the backend-generated theme tags
          }
        })

        // Update state with enhanced thoughts
        if (forceRefresh || pageNum === 1) {
          setThoughts(enhancedThoughts)
        } else {
          setThoughts((prev) => [...prev, ...enhancedThoughts])
        }

        // Also update the tracking when we create a new thought
        if (newThoughtId && !userThoughtIds.includes(newThoughtId)) {
          const updatedIds = [...userThoughtIds, newThoughtId]
          localStorage.setItem(
            'userCreatedThoughts',
            JSON.stringify(updatedIds)
          )
        }

        setTotalPages(result.totalPages || 1)
        return { success: true, data: fetchedThoughts }
      }

      setError('Failed to fetch thoughts')
      return result
    } catch (err) {
      console.error('Error fetching thoughts:', err)
      setError('An error occurred while fetching thoughts')
      return { success: false }
    } finally {
      setLoading(false)
    }
  }

  // Get user's liked thoughts
  const fetchLikedThoughts = async () => {
    try {
      setLikedLoading(true)
      const data = await api.getLikedThoughts()

      if (data.success) {
        // Access data directly, without trying to go through response.thoughts
        setLikedThoughts(data.data || [])
      } else {
        console.error('Server error retrieving liked thoughts')
        setLikedThoughts([])
      }
    } catch (error) {
      console.error('Error in fetchLikedThoughts:', error)
      setLikedThoughts([])
    } finally {
      setLikedLoading(false)
    }
  }

  // Check if a thought is liked by current user
  const isThoughtLiked = (thoughtId) => {
    // First check likedThoughts from API if available
    if (likedThoughts.length > 0) {
      return likedThoughts.some((thought) => thought._id === thoughtId)
    }

    // Fallback to localStorage method (your current implementation)
    const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]')
    return likedPosts.includes(thoughtId)
  }

  // Create a new thought
  const { getCurrentUserId } = useThoughtAuthorization()

  const createThought = async (message) => {
    try {
      // Get current user ID before making the API call
      const token = localStorage.getItem('token')
      let currentUserId = null

      if (token) {
        try {
          const decoded = jwtDecode(token)
          currentUserId = decoded.userId
          console.log('Creating thought with userId:', currentUserId)
        } catch (error) {
          console.error('Error decoding token:', error)
        }
      }

      const result = await api.postThought(message)
      console.log('Create thought API result:', result)

      if (result && result.success) {
        // Get the new thought data (could be in result.data or result.response)
        const newThought = result.data || result.response

        if (newThought) {
          // Add user ID explicitly to the thought object
          const enhancedThought = {
            ...newThought,
            userId: currentUserId // Explicitly set the user ID
          }

          console.log('Enhanced thought with userId:', enhancedThought)

          // Update state with the enhanced thought
          setThoughts((prevThoughts) => [enhancedThought, ...prevThoughts])
          setNewThoughtId(enhancedThought._id)

          // Track this thought as created by the current user
          const userThoughtIds = JSON.parse(
            localStorage.getItem('userCreatedThoughts') || '[]'
          )
          if (!userThoughtIds.includes(enhancedThought._id)) {
            const updatedIds = [...userThoughtIds, enhancedThought._id]
            localStorage.setItem(
              'userCreatedThoughts',
              JSON.stringify(updatedIds)
            )
          }

          // Force a refresh of the thoughts list after a short delay
          setTimeout(() => fetchThoughts(1, true), 300)

          return { success: true, response: enhancedThought }
        }
      }

      return result
    } catch (err) {
      console.error('Error in createThought:', err)
      setError('An error occurred while creating the thought')
      return {
        success: false,
        response: null,
        message: err.message
      }
    }
  }

  // Delete a thought
  const deleteThought = async (thoughtId) => {
    try {
      // Check ownership before attempting to delete
      const thoughtToDelete = thoughts.find((t) => t._id === thoughtId)
      const currentUserId = getCurrentUserId()

      if (thoughtToDelete && thoughtToDelete.userId !== currentUserId) {
        setError('You can only delete your own thoughts')
        return false
      }

      // Optimistically remove from UI for better UX
      setThoughts(thoughts.filter((thought) => thought._id !== thoughtId))

      const result = await api.deleteThought(thoughtId)

      if (!result.success) {
        // Only if API explicitly says it failed, restore the thought to the UI
        setThoughts((prevThoughts) => {
          if (thoughtToDelete) {
            return [...prevThoughts, thoughtToDelete].sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            )
          }
          return prevThoughts
        })

        // Set error message from API response
        setError(result.message || 'Failed to delete thought')
        return false
      }

      return true
    } catch (err) {
      console.error('Error in deleteThought:', err)
      // Even on error, keep the thought deleted from UI for better UX
      setError('There was an issue syncing with the server')
      return true
    }
  }

  // Update a thought
  const updateThought = async (thoughtId, newMessage) => {
    try {
      const result = await api.updateThought(thoughtId, newMessage)

      if (result.success) {
        setThoughts((prevThoughts) =>
          prevThoughts.map((thought) =>
            thought._id === thoughtId
              ? { ...thought, message: newMessage }
              : thought
          )
        )
        return result
      }
    } catch (error) {
      console.error('Error updating thought:', error)
      throw error
    }
  }

  // Toggle like on a thought
  const toggleLike = async (thoughtId) => {
    // Optimistic update for UI
    const isCurrentlyLiked = isThoughtLiked(thoughtId)

    // Update local storage immediately for responsive UI
    const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]')

    if (isCurrentlyLiked) {
      localStorage.setItem(
        'likedPosts',
        JSON.stringify(likedPosts.filter((id) => id !== thoughtId))
      )
    } else {
      localStorage.setItem(
        'likedPosts',
        JSON.stringify([...likedPosts, thoughtId])
      )
    }

    // Dispatch event for other components that use localStorage
    window.dispatchEvent(new Event('localStorageUpdated'))

    // Update thoughts in state
    setThoughts((prevThoughts) =>
      prevThoughts.map((thought) =>
        thought._id === thoughtId
          ? {
              ...thought,
              hearts: isCurrentlyLiked ? thought.hearts - 1 : thought.hearts + 1
            }
          : thought
      )
    )

    try {
      // Make API call
      const response = await api.likeThought(thoughtId)

      // If you have a liked thoughts list, update it
      if (likedThoughts.length > 0) {
        fetchLikedThoughts()
      }

      return response
    } catch (error) {
      console.error('Error toggling like:', error)
      // Revert optimistic update on error
      fetchThoughts(currentPage)
      throw error
    }
  }

  // Load data on mount
  useEffect(() => {
    fetchThoughts(currentPage)

    // Only fetch liked thoughts if user is logged in
    const token = localStorage.getItem('token')
    if (token) {
      fetchLikedThoughts()
    }
  }, [currentPage])

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Add this useEffect for periodic refresh
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      // Only auto-refresh if the user is on the first page
      if (currentPage === 1 && !loading) {
        console.log('Auto-refreshing thoughts data...')
        fetchThoughts(1, true)
      }
    }, 60000) // Auto-refresh every 60 seconds

    return () => clearInterval(refreshInterval)
  }, [currentPage, loading])

  return (
    <ThoughtsContext.Provider
      value={{
        thoughts,
        likedThoughts,
        loading,
        likedLoading,
        error,
        isOnline,
        currentPage,
        totalPages,
        newThoughtId,
        isThoughtLiked,
        toggleLike,
        fetchThoughts,
        fetchLikedThoughts,
        createThought,
        deleteThought,
        updateThought,
        setCurrentPage
      }}
    >
      {children}
    </ThoughtsContext.Provider>
  )
}

export const useThoughts = () => useContext(ThoughtsContext)
