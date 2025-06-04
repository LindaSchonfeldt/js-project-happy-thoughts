import { useEffect, useRef, useState, useCallback } from 'react'

import { api } from '../api/api'

export const useThoughts = () => {
  const [thoughts, setThoughts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [newThoughtId, setNewThoughtId] = useState(null)

  // Pagination state
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const ITEMS_PER_PAGE = 10

  // Locks
  const isFetchingRef = useRef(false)

  // Fetch thoughts with pagination
  const fetchThoughts = useCallback(
    async (pageNum = page) => {
      // Prevent duplicate fetches
      if (isFetchingRef.current) {
        console.log('Fetch already in progress, skipping duplicate request')
        return
      }

      isFetchingRef.current = true
      setLoading(true)
      setError(null)

      try {
        const data = await api.getThoughts(pageNum, ITEMS_PER_PAGE)

        // Check if data exists and has the expected structure
        if (data && Array.isArray(data.thoughts)) {
          if (pageNum === 1) {
            setThoughts(data.thoughts)
          } else {
            // Append new thoughts to existing ones
            setThoughts((prev) => [...prev, ...data.thoughts])
          }

          // Update pagination info
          setHasMore(data.page < data.totalPages)
          setTotalPages(data.totalPages)
          setPage(data.page)
        } else {
          console.error('Unexpected API response structure:', data)
          setThoughts([])
          setError('Unexpected data format from API')
        }
      } catch (error) {
        console.error('Error fetching thoughts:', error)
        setError('Failed to load happy thoughts. Please try again.')
      } finally {
        setLoading(false)
        isFetchingRef.current = false
      }
    },
    [page]
  )

  // Load next page
  const loadMore = () => {
    if (hasMore && !loading) {
      fetchThoughts(page + 1)
    }
  }

  // Add new thought
  const addThought = (newObj) => {
    setThoughts((prev) => [newObj, ...prev])
    setNewThoughtId(newObj._id)
    setTimeout(() => setNewThoughtId(null), 1000)
  }

  // Combine optimistic add + full refetch
  const createAndRefresh = async (serverThought) => {
    console.log('createAndRefresh got:', serverThought)
    addThought(serverThought)
    await fetchThoughts(1) // Reset to first page after adding a thought
  }

  // Add this useEffect for initial data loading
  const isInitialMount = useRef(true)

  useEffect(() => {
    // Prevent double fetching in React StrictMode
    if (isInitialMount.current) {
      fetchThoughts(1)
      isInitialMount.current = false
    }
  }, [fetchThoughts])

  return {
    thoughts,
    loading,
    error,
    newThoughtId,
    createAndRefresh,
    loadMore,
    hasMore,
    page,
    totalPages
  }
}
