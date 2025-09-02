/**
 * LikeCounter Component
 * Purpose: Displays and updates the like count for a thought.
 * Usage: Used in Thought and ThoughtsList components.
 * Author: Linda Schonfeldt
 * Last Updated: September 2, 2025
 */
import { useState, useEffect } from 'react'
import styled from 'styled-components'

const StyledLikeCounter = styled.div`
  padding: 8px 16px;
  background-color: #ffadad;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: #333;
  margin: 1rem auto;
  width: fit-content;
`

// Add a counter component to show total likes made by user
export const LikeCounter = () => {
  const [totalLikes, setTotalLikes] = useState(() => {
    const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]')
    return likedPosts.length
  })

  // Update when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]')
      setTotalLikes(likedPosts.length)
    }

    // Listen for standard storage events (from other tabs)
    window.addEventListener('storage', handleStorageChange)

    // Listen for custom events (from current tab)
    window.addEventListener('localStorageUpdated', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('localStorageUpdated', handleStorageChange)
    }
  }, [])

  return <StyledLikeCounter>You've liked {totalLikes} posts</StyledLikeCounter>
}
