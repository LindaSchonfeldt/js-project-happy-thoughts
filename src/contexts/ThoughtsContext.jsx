import React, { createContext, useContext, useEffect, useState } from 'react'

import { api } from '../api/api'
import { useThoughtAuthorization } from '../hooks/useThoughtAuthorization'

export const ThoughtsContext = createContext()

export const ThoughtsProvider = ({ children }) => {
  const [thoughts, setThoughts] = useState([])
  const [page, setPage] = useState(1)
  const { getCurrentUserId } = useThoughtAuthorization()
  const currentUserId = getCurrentUserId()

  const fetchThoughts = async () => {
    try {
      const result = await api.getThoughts(page)
      const enhanced = result.data.map((thought) => ({
        ...thought,
        // directly mark own‐thoughts, no undefined variable needed
        isOwn: thought.userId === currentUserId
      }))
      setThoughts(enhanced)
    } catch (err) {
      console.error('Error fetching thoughts:', err)
    }
  }

  useEffect(() => {
    fetchThoughts()
  }, [page, currentUserId])

  return (
    <ThoughtsContext.Provider value={{ thoughts, setPage }}>
      {children}
    </ThoughtsContext.Provider>
  )
}

export const useThoughts = () => useContext(ThoughtsContext)
