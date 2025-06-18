import React, { createContext, useContext, useEffect, useState } from 'react'

import { api } from '../api/api'
import { useThoughtAuthorization } from '../hooks/useThoughtAuthorization'

export const ThoughtsContext = createContext()

export const ThoughtsProvider = ({ children }) => {
  const [thoughts, setThoughts] = useState([])
  const [page, setPage] = useState(1)
  const { getCurrentUserId } = useThoughtAuthorization()
  const currentUserId = getCurrentUserId()

  const fetchThoughts = async (p = page) => {
    try {
      const result = await api.getThoughts(p)
      const enhanced = result.data.map((t) => ({
        ...t,
        isOwn: t.userId === currentUserId
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
    <ThoughtsContext.Provider
      value={{
        thoughts,
        setPage,
        fetchThoughts
      }}
    >
      {children}
    </ThoughtsContext.Provider>
  )
}

export const useThoughts = () => useContext(ThoughtsContext)
