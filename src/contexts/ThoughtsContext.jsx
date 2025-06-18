import React, { createContext, useContext, useEffect, useState } from 'react'

import { api } from '../api/api'
import { useThoughtAuthorization } from '../hooks/useThoughtAuthorization'

export const ThoughtsContext = createContext()

export const ThoughtsProvider = ({ children }) => {
  const [thoughts, setThoughts] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [totalPages, setTotalPages] = useState(1)
  const [newThoughtId, setNewThoughtId] = useState(null)

  const { getCurrentUserId } = useThoughtAuthorization()
  const currentUserId = getCurrentUserId()

  // Fetch paginated thoughts
  const fetchThoughts = async (p = page, force = false) => {
    setLoading(true)
    setError(null)
    try {
      const { data, totalPages: tp } = await api.getThoughts(p)
      const enhanced = data.map((t) => ({
        ...t,
        isOwn: t.userId === currentUserId
      }))
      setThoughts(enhanced)
      setTotalPages(tp)
      if (force) setPage(p)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Create
  const createThought = async (message) => {
    const result = await api.postThought(message)
    if (result.success) {
      setNewThoughtId(result.response._id)
      setThoughts((prev) => [result.response, ...prev])
      return result
    }
    throw new Error(result.message)
  }

  // Delete
  const deleteThought = async (id) => {
    await api.deleteThought(id)
    setThoughts((prev) => prev.filter((t) => t._id !== id))
  }

  // Update
  const updateThought = async (id, message) => {
    const result = await api.updateThought(id, message)
    if (result.success) {
      setThoughts((prev) =>
        prev.map((t) => (t._id === id ? { ...t, message } : t))
      )
      return result
    }
    throw new Error(result.message)
  }

  useEffect(() => {
    fetchThoughts()
  }, [page, currentUserId])

  return (
    <ThoughtsContext.Provider
      value={{
        thoughts,
        loading,
        error,
        currentPage: page,
        totalPages,
        newThoughtId,
        fetchThoughts,
        setPage,
        createThought,
        deleteThought,
        updateThought
      }}
    >
      {children}
    </ThoughtsContext.Provider>
  )
}

export const useThoughts = () => useContext(ThoughtsContext)
