import { useState, useEffect, createContext, useContext } from 'react'
import { api } from '../api/api'

const ThoughtsContext = createContext()

export const ThoughtsProvider = ({ children }) => {
  const [thoughts, setThoughts] = useState([])
  const [likedThoughts, setLikedThoughts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [newThoughtId, setNewThoughtId] = useState(null)

  // Get all thoughts
  const fetchThoughts = async (page = 1) => {
    try {
      setLoading(true)
      setError(null)

      const data = await api.getThoughts(page)

      if (data.success) {
        const thoughtsList = data.response.thoughts || []

        // Sort by creation date (newest first)
        const sortedThoughts = thoughtsList.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )

        setThoughts(sortedThoughts)
        setCurrentPage(data.response.pagination?.current || page)
        setTotalPages(data.response.pagination?.pages || 1)
      }
    } catch (err) {
      console.error('Error fetching thoughts:', err)
      setError('Failed to load thoughts')
    } finally {
      setLoading(false)
    }
  }

  // Get user's liked thoughts
  const fetchLikedThoughts = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      setLoading(true)

      // You'll need to implement this endpoint in your API
      const response = await api.getLikedThoughts()

      if (response.success) {
        setLikedThoughts(response.data)
      }
    } catch (error) {
      console.error('Error fetching liked thoughts:', error)
    } finally {
      setLoading(false)
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
  const createThought = async (message) => {
    try {
      const result = await api.postThought(message)

      if (result.success) {
        const newThought = result.response
        setNewThoughtId(newThought._id)

        // Add to the beginning of the list
        setThoughts((prevThoughts) => [newThought, ...prevThoughts])

        // Reset to first page if needed
        if (currentPage !== 1) {
          setCurrentPage(1)
        }

        // Clear highlight after 3 seconds
        setTimeout(() => {
          setNewThoughtId(null)
        }, 3000)

        return result
      }
    } catch (error) {
      console.error('Error creating thought:', error)
      throw error
    }
  }

  // Delete a thought
  const deleteThought = async (thoughtId) => {
    // Optimistic update
    const originalThoughts = thoughts
    setThoughts((prevThoughts) =>
      prevThoughts.filter((thought) => thought._id !== thoughtId)
    )

    try {
      const result = await api.deleteThought(thoughtId)
      return result
    } catch (error) {
      // Restore on error
      setThoughts(originalThoughts)
      console.error('Error deleting thought:', error)
      throw error
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

  return (
    <ThoughtsContext.Provider
      value={{
        thoughts,
        likedThoughts,
        loading,
        error,
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
