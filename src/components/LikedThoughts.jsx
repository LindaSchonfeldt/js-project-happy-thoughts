/**
 * LikedThoughts Component
 * Purpose: Displays thoughts liked by the authenticated user.
 * Usage: Used in user profile and dashboard views.
 * Author: Linda Schonfeldt
 * Last Updated: September 2, 2025
 */
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { api } from '../api/api'
import { useAuth } from '../contexts/AuthContext'
import { Loader } from './Loader'
import { Pagination } from './Pagination'
import { Thought } from './Thought'
import { ThoughtCounter } from './ThoughtCounter'

// Make sure this import exists

const LikedThoughtsContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`

const Header = styled.h1`
  font-family: 'Roboto Mono', monospace;
  font-size: 24px;
  text-align: center;
  margin-bottom: 20px;
`

const EmptyState = styled.p`
  text-align: center;
  color: #888;
`

const AuthMessageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
  text-align: center;
  padding: 20px;
  max-width: 600px;
  margin: 32px auto;
`

const AuthTitle = styled.h2`
  font-family: 'Roboto Mono', monospace;
  font-size: 24px;
  text-align: center;
  margin-bottom: 20px;
`

const AuthText = styled.p`
  color: #555;
  margin-bottom: 20px;
`

export const LikedThoughts = () => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [allLikedThoughts, setAllLikedThoughts] = useState([])
  const [filteredThoughts, setFilteredThoughts] = useState([]) // <-- added
  const [totalPages, setTotalPages] = useState(1) // <-- added
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState(null) // <-- added
  const THOUGHTS_PER_PAGE = 10

  useEffect(() => {
    const fetchLiked = async () => {
      if (!isAuthenticated) {
        setAllLikedThoughts([]) // <-- use setAllLikedThoughts
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        console.log('Fetching liked thoughts from server...')
        const result = await api.getLikedThoughts()
        console.log('getLikedThoughts result:', result)

        if (result && result.success && Array.isArray(result.response)) {
          setAllLikedThoughts(result.response) // <-- use setAllLikedThoughts
        } else {
          setAllLikedThoughts([]) // <-- use setAllLikedThoughts
          if (result && !result.success) {
            console.warn('getLikedThoughts returned failure:', result.message)
            setError(result.message || 'Failed to fetch liked thoughts')
          }
        }
      } catch (err) {
        console.error('Error fetching liked thoughts:', err)
        setAllLikedThoughts([]) // <-- use setAllLikedThoughts
        setError(err.message || 'Network error fetching liked thoughts')
      } finally {
        setLoading(false)
      }
    }

    fetchLiked()
  }, [isAuthenticated])

  // Calculate total pages and apply pagination whenever allLikedThoughts or currentPage changes
  useEffect(() => {
    if (!allLikedThoughts.length) {
      setFilteredThoughts([])
      setTotalPages(1)
      return
    }

    // Calculate total pages
    const calculatedTotalPages = Math.max(
      1,
      Math.ceil(allLikedThoughts.length / THOUGHTS_PER_PAGE)
    )
    setTotalPages(calculatedTotalPages)

    // If current page is beyond total pages, adjust it
    if (currentPage > calculatedTotalPages && calculatedTotalPages > 0) {
      setCurrentPage(1)
      return // This will trigger another effect run with page 1
    }

    // Apply pagination
    const startIndex = (currentPage - 1) * THOUGHTS_PER_PAGE
    const endIndex = Math.min(
      startIndex + THOUGHTS_PER_PAGE,
      allLikedThoughts.length
    )

    const paginatedLikes = allLikedThoughts.slice(startIndex, endIndex)
    setFilteredThoughts(paginatedLikes)

    console.log(
      `Page ${currentPage}/${calculatedTotalPages}: displaying ${paginatedLikes.length} liked thoughts`
    )
  }, [allLikedThoughts, currentPage])

  // Handler for deleting a thought (updates UI and list)
  const deleteThought = async (id) => {
    try {
      const res = await api.deleteThought(id)
      if (res && res.success) {
        setAllLikedThoughts((prev) => prev.filter((t) => t._id !== id))
      } else {
        setError(res.message || 'Failed to delete thought')
      }
    } catch (err) {
      setError(err.message || 'Network error deleting thought')
    }
  }

  // Handler for page changes
  const handlePageChange = (newPage) => {
    console.log(`Changing to page ${newPage}`)
    setCurrentPage(newPage)
    window.scrollTo(0, 0) // Scroll to top when changing pages
  }

  // Handler for opening update modal
  const handleOpenUpdateModal = (thought) => {
    // Implementation for opening update modal (wire into your App if needed)
    console.log('Open update modal for', thought?._id)
  }

  if (loading) {
    return <Loader message='Loading your liked thoughts...' />
  }

  if (!isAuthenticated) {
    return (
      <AuthMessageContainer>
        <AuthTitle>Authentication Required</AuthTitle>
        <AuthText>
          You need to be logged in to see your liked thoughts. This helps us
          keep track of which thoughts you've enjoyed!
        </AuthText>
      </AuthMessageContainer>
    )
  }

  return (
    <LikedThoughtsContainer>
      <Header>Thoughts You've Liked</Header>

      {error ? (
        <EmptyState>Error loading thoughts: {error}</EmptyState>
      ) : filteredThoughts.length === 0 ? (
        <EmptyState>You haven't liked any thoughts yet.</EmptyState>
      ) : (
        <>
          <ThoughtCounter
            filteredThoughts={filteredThoughts}
            currentPage={currentPage}
            totalPages={totalPages}
          />

          {filteredThoughts.map((thought) => (
            <Thought
              key={thought._id}
              _id={thought._id}
              message={thought.message}
              hearts={thought.hearts}
              createdAt={thought.createdAt}
              tags={thought.tags}
              userId={thought.userId || thought.user?._id || thought.user}
              username={thought.username}
              isAnonymous={!thought.username}
              onDelete={deleteThought}
              onUpdate={handleOpenUpdateModal}
            />
          ))}
        </>
      )}

      {/* Add pagination UI */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </LikedThoughtsContainer>
  )
}
