import { useState } from 'react'

import { api } from '../api/api'

export const useLikeSystem = (thoughtId, initialHearts) => {
  // Track if the current user has liked this post (persisted via localStorage)
  const [isLiked, setIsLiked] = useState(() => {
    try {
      // Check localStorage on component mount
      const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]')
      return likedPosts.includes(thoughtId)
    } catch (e) {
      console.error('Error reading from localStorage:', e)
      return false
    }
  })

  // Track the total like count, starting with hearts from API
  // If user has already liked it from localStorage, make sure UI is consistent
  const [likeCount, setLikeCount] = useState(
    isLiked ? Math.max(initialHearts, 1) : initialHearts
  )

  // Update localStorage when like status changes
  const updateLocalStorage = (isLiked) => {
    const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]')

    if (isLiked) {
      if (!likedPosts.includes(thoughtId)) {
        localStorage.setItem(
          'likedPosts',
          JSON.stringify([...likedPosts, thoughtId])
        )
        window.dispatchEvent(new Event('localStorageUpdated')) // This is crucial
      }
    } else {
      const updatedLikes = likedPosts.filter((postId) => postId !== thoughtId)
      localStorage.setItem('likedPosts', JSON.stringify(updatedLikes))
      window.dispatchEvent(new Event('localStorageUpdated')) // This is crucial
    }
  }

  const handleLike = () => {
    // Update UI optimistically for both like and unlike
    const newLikedState = !isLiked
    setIsLiked(newLikedState)
    setLikeCount((prevCount) => (newLikedState ? prevCount + 1 : prevCount - 1))
    updateLocalStorage(newLikedState)

    // ✅ FIX: Make API call for both like AND unlike
    api
      .likeThought(thoughtId)
      .then((data) => {
        console.log('Response data:', data)
        // Update like count with the server's value
        if (data && typeof data.hearts === 'number') {
          setLikeCount(data.hearts)
        }
      })
      .catch((error) => {
        console.error('Error updating like status:', error)

        // Revert UI changes on error
        setIsLiked(!newLikedState) // Revert to previous state
        setLikeCount((prevCount) =>
          newLikedState ? prevCount - 1 : prevCount + 1
        )
        updateLocalStorage(!newLikedState) // Revert localStorage
      })
  }

  return {
    isLiked,
    likeCount,
    handleLike
  }
}
