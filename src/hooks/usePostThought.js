import { useState, useRef } from 'react'
import { api } from '../api/api'

export const usePostThought = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const postThought = async (message) => {
    setLoading(true)
    setError(null)

    try {
      console.log('Hook: Posting message:', message, 'Type:', typeof message)

      // Validate message
      if (!message || typeof message !== 'string') {
        throw new Error('Message must be a string')
      }

      const result = await api.postThought(message.trim())
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { postThought, loading, error }
}
