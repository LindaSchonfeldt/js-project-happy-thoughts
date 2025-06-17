import { useEffect, useState } from 'react'

import { api } from '../api/api'

export const useThoughts = () => {
  const [thoughts, setThoughts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [newThoughtId, setNewThoughtId] = useState(null)
  const [serverStarting, setServerStarting] = useState(false)

  const fetchThoughts = async (page = 1, retryCount = 0) => {
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

        const paginationData = data.response.pagination || {}

        setThoughts(sortedThoughts)
        setCurrentPage(paginationData.current || page)
        setTotalPages(paginationData.pages || 1)
      }
    } catch (err) {
      console.error('Error fetching thoughts:', err)

      if (
        err.message.includes('CORS') ||
        err.message.includes('NetworkError')
      ) {
        setError(
          'Unable to connect to server. Please check if the backend is running and CORS is configured for this domain.'
        )
      } else {
        setError('Failed to load thoughts')
      }
    } finally {
      setLoading(false)
    }
  }

  const createThought = async (message) => {
    try {
      console.log(
        'Creating thought with message:',
        message,
        'Type:',
        typeof message
      )

      const result = await api.postThought(message)
      console.log('Post thought result:', result)

      if (result.success) {
        const newThought = result.response
        setNewThoughtId(newThought._id)
        console.log('New thought ID set:', newThought._id)

        // Add the new thought to the TOP of the existing list
        setThoughts((prevThoughts) => [newThought, ...prevThoughts])

        // Update current page to 1 if we're on a different page
        if (currentPage !== 1) {
          setCurrentPage(1)
          // The useEffect will handle fetching page 1 data
        }

        // Clear the new thought highlight after 3 seconds
        setTimeout(() => {
          setNewThoughtId(null)
        }, 3000)
      } else {
        console.error('Post thought failed:', result)
        setError('Failed to create thought')
      }
    } catch (err) {
      console.error('Error creating thought:', err)
      setError('Failed to create thought: ' + err.message)
    }
  }

  const handleDeleteThought = async (thoughtId) => {
    // Optimistically remove from UI first for better UX
    const originalThoughts = thoughts
    setThoughts((prevThoughts) =>
      prevThoughts.filter((thought) => thought._id !== thoughtId)
    )

    try {
      await api.deleteThought(thoughtId)
      console.log('Thought deleted successfully')
      setError(null)
    } catch (err) {
      console.error('Error deleting thought:', err)

      if (err.message.includes('404') || err.message.includes('not found')) {
        console.log('Thought was already deleted on server, keeping UI updated')
      } else {
        setThoughts(originalThoughts)
        setError('Failed to delete thought. Please try again.')
        setTimeout(() => setError(null), 3000)
      }
    }
  }

  const handleUpdateThought = async (thoughtId, newMessage) => {
    try {
      const result = await api.updateThought(thoughtId, newMessage)

      if (result.success) {
        // Update the thought in the list
        setThoughts((prevThoughts) =>
          prevThoughts.map((thought) =>
            thought._id === thoughtId
              ? { ...thought, message: newMessage }
              : thought
          )
        )
      }
    } catch (error) {
      console.error('Error updating thought:', error)
      setError('Failed to update thought')
    }
  }

  const getCurrentUserId = () => {
    const token = localStorage.getItem('token')
    if (!token) return null

    try {
      // Decode JWT to get user ID (basic decode, not verification)
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

  // Fetch thoughts when component mounts or page changes
  useEffect(() => {
    fetchThoughts(currentPage)
  }, [currentPage])

  return {
    thoughts,
    loading,
    error,
    currentPage,
    totalPages,
    newThoughtId,
    serverStarting,
    currentUserId: getCurrentUserId(),
    setCurrentPage,
    createThought,
    handleDeleteThought,
    handleUpdateThought,
    fetchThoughts
  }
}
