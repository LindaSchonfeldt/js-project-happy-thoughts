/**
 * useLikeSystem Hook
 * Purpose: Custom React hook for managing like functionality.
 * Usage: Used by components to handle liking thoughts.
 * Author: Linda Schonfeldt
 * Last Updated: September 2, 2025
 */
import { useState } from 'react'

import { api } from '../api/api'
import { useAuth } from '../contexts/AuthContext'

export const useLikeSystem = (
  thoughtId,
  initialHearts,
  initialIsLikedByUser = false
) => {
  const { isAuthenticated } = useAuth()

  // For auth users: use server state, for anon: use localStorage
  const [isLiked, setIsLiked] = useState(() => {
    if (isAuthenticated) {
      // For auth users, trust the server-provided initialIsLikedByUser
      return initialIsLikedByUser
    } else {
      // For anon users, check localStorage
      try {
        const likedPosts = JSON.parse(
          localStorage.getItem('likedPosts') || '[]'
        )
        return likedPosts.includes(thoughtId)
      } catch (e) {
        console.error('Error reading from localStorage:', e)
        return false
      }
    }
  })

  const [likeCount, setLikeCount] = useState(initialHearts || 0)

  // Only update localStorage for anonymous users
  const updateLocalStorage = (isLiked) => {
    if (!isAuthenticated) {
      const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]')

      if (isLiked) {
        if (!likedPosts.includes(thoughtId)) {
          localStorage.setItem(
            'likedPosts',
            JSON.stringify([...likedPosts, thoughtId])
          )
        }
      } else {
        const updatedLikes = likedPosts.filter((postId) => postId !== thoughtId)
        localStorage.setItem('likedPosts', JSON.stringify(updatedLikes))
      }

      window.dispatchEvent(new Event('localStorageUpdated'))
    }
  }

  const handleLike = () => {
    // Update UI optimistically for both like and unlike
    const newLikedState = !isLiked
    setIsLiked(newLikedState)
    setLikeCount((prevCount) => (newLikedState ? prevCount + 1 : prevCount - 1))

    // Only update localStorage for anonymous users
    if (!isAuthenticated) {
      updateLocalStorage(newLikedState)
    }

    // Send the action parameter based on new state
    const action = newLikedState ? 'like' : 'unlike'
    api
      .likeThought(thoughtId, action)
      .then((data) => {
        // Update like count with the server's value
        if (data && data.success && typeof data.response?.hearts === 'number') {
          setLikeCount(data.response.hearts)
        }
      })
      .catch((error) => {
        console.error('Error updating like status:', error)

        // Revert UI changes on error
        setIsLiked(!newLikedState)
        setLikeCount((prevCount) =>
          newLikedState ? prevCount - 1 : prevCount + 1
        )

        if (!isAuthenticated) {
          updateLocalStorage(!newLikedState)
        }
      })
  }

  return {
    isLiked,
    likeCount,
    handleLike
  }
}
