import { useCallback, useEffect, useRef, useState } from 'react'

import { api } from '../api/api'

export const useThoughts = () => {
  const [thoughts, setThoughts] = useState([])
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [newThoughtId, setNewThoughtId] = useState(null)
  const [serverStarting, setServerStarting] = useState(false)

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
        if (
          data &&
          data.success &&
          data.response &&
          Array.isArray(data.response.thoughts)
        ) {
          const { thoughts, currentPage, totalPages } = data.response

          // Sort thoughts by creation date (newest first)
          const sortedThoughts = thoughts.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          )

          if (pageNum === 1) {
            setThoughts(sortedThoughts) // Replace thoughts for the first page
          } else {
            // Append new thoughts to existing ones and sort again
            setThoughts((prev) =>
              [...prev, ...sortedThoughts].sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
              )
            )
          }

          // Update pagination info
          setHasMore(currentPage < totalPages)
          setTotalPages(totalPages)
          setPage(currentPage)
        } else {
          console.error('Unexpected API response structure:', data)
          setThoughts([])
          setError('Unexpected data format from API')
        }
      } catch (error) {
        if (error.message.includes('503')) {
          setServerStarting(true)
        } else {
          setError(`Something went wrong: ${error.message}`)
        }
      } finally {
        setLoading(false)
        isFetchingRef.current = false
      }
    },
    [page]
  )

  // Load next page
  const loadMore = () => {
    if (hasMore && !isLoading) {
      fetchThoughts(page + 1)
    }
  }

  // Post new thought
  const postThought = (newObj) => {
    setThoughts((prev) => [newObj, ...prev])
    setNewThoughtId(newObj._id)
    setTimeout(() => setNewThoughtId(null), 1000)
  }

  // Combine optimistic add + full refetch
  const createAndRefresh = async (serverThought) => {
    console.log('createAndRefresh got:', serverThought)
    postThought(serverThought)
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
    loading: isLoading,
    error,
    newThoughtId,
    createAndRefresh,
    loadMore,
    hasMore,
    page,
    totalPages,
    serverStarting
  }
}
