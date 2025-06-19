import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { useThoughts } from '../contexts/ThoughtsContext'
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

export const LikedThoughts = () => {
  // Add state for liked thoughts
  const [filteredThoughts, setFilteredThoughts] = useState([]) // Renamed from likedThoughts to filteredThoughts
  const [loadingLikes, setLoadingLikes] = useState(false)
  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [allLikedThoughts, setAllLikedThoughts] = useState([]) // Store all liked thoughts

  const { thoughts, loading, error, deleteThought, updateThought } =
    useThoughts()

  const navigate = useNavigate()

  // Find all liked thoughts first
  useEffect(() => {
    if (!thoughts || loading) return

    try {
      // Get liked post IDs from localStorage
      const likedIds = JSON.parse(localStorage.getItem('likedPosts') || '[]')

      // Filter all thoughts to show only liked ones
      const liked = thoughts.filter((thought) => likedIds.includes(thought._id))
      setAllLikedThoughts(liked)

      // Calculate total pages
      const THOUGHTS_PER_PAGE = 10
      const calculatedTotalPages = Math.max(
        1,
        Math.ceil(liked.length / THOUGHTS_PER_PAGE)
      )
      setTotalPages(calculatedTotalPages)

      console.log(
        `Found ${liked.length} liked thoughts, total pages: ${calculatedTotalPages}`
      )

      // If current page is beyond total pages, adjust it
      if (currentPage > calculatedTotalPages && calculatedTotalPages > 0) {
        setCurrentPage(1)
        return // This will trigger another effect run with page 1
      }

      // Apply pagination
      const startIndex = (currentPage - 1) * THOUGHTS_PER_PAGE
      const endIndex = Math.min(startIndex + THOUGHTS_PER_PAGE, liked.length)

      // Get current page of liked thoughts
      const paginatedLikes = liked.slice(startIndex, endIndex)
      setFilteredThoughts(paginatedLikes)

      console.log(
        `Page ${currentPage}/${calculatedTotalPages}: displaying ${paginatedLikes.length} liked thoughts`
      )
    } catch (e) {
      console.error('Error getting liked thoughts:', e)
    } finally {
      setLoadingLikes(false)
    }
  }, [thoughts, currentPage, loading])

  // Handler for page changes
  const handlePageChange = (newPage) => {
    console.log(`Changing to page ${newPage}`)
    setCurrentPage(newPage)
    window.scrollTo(0, 0) // Scroll to top when changing pages
  }

  // Handler for opening update modal
  const handleOpenUpdateModal = (thought) => {
    // Implementation for opening update modal
  }

  if (loading || loadingLikes) {
    return <Loader message='Loading your liked thoughts...' />
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
