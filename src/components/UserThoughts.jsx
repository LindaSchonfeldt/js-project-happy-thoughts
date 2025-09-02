import { jwtDecode } from 'jwt-decode'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { useThoughts } from '../contexts/ThoughtsContext'
import { Loader } from './Loader'
import { Pagination } from './Pagination'
import { Thought } from './Thought'
import { ThoughtCounter } from './ThoughtCounter'

const UserThoughtsContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`

const Header = styled.h1`
  font-family: 'Roboto Mono', monospace;
  font-size: 24px;
  text-align: center;
  margin: 32px auto;
  margin-bottom: 20px;
`

const EmptyState = styled.p`
  text-align: center;
  margin: 0;
  color: #666;
`

export const UserThoughts = () => {
  // Debug mode
  const DEBUG = true

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filteredThoughts, setFilteredThoughts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [allUserThoughts, setAllUserThoughts] = useState([])

  const { thoughts, loading, error, deleteThought, updateThought } =
    useThoughts()
  const navigate = useNavigate()

  const getCurrentUserId = () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return null

      const decoded = jwtDecode(token)
      return decoded.userId || decoded.id || decoded.sub
    } catch (error) {
      console.error('Error decoding token:', error)
      return null
    }
  }

  const currentUserId = getCurrentUserId()

  // Combined effect for filtering and pagination to avoid race conditions
  useEffect(() => {
    if (!thoughts || loading) return
    setIsLoading(true)

    try {
      // Step 1: Filter thoughts for current user
      const myThoughts = thoughts.filter((thought) => {
        const thoughtUserId =
          thought.userId || thought.user?._id || thought.user
        const isOwn = thoughtUserId === currentUserId
        if (DEBUG) {
          console.log(
            `Thought ${thought._id.slice(
              0,
              8
            )}: userId=${thoughtUserId}, currentUser=${currentUserId}, isOwn=${isOwn}`
          )
        }
        return isOwn
      })

      if (DEBUG) {
        console.log(
          `Found ${myThoughts.length} thoughts belonging to user ${currentUserId}`
        )
      }

      // Step 2: Update filtered thoughts state
      setAllUserThoughts(myThoughts)

      // Step 3: Calculate pagination in the same effect
      const THOUGHTS_PER_PAGE = 10
      const calculatedTotalPages = Math.max(
        1,
        Math.ceil(myThoughts.length / THOUGHTS_PER_PAGE)
      )

      if (DEBUG) {
        console.log(
          `Total user thoughts: ${myThoughts.length}, Page size: ${THOUGHTS_PER_PAGE}, Total pages: ${calculatedTotalPages}`
        )
      }

      setTotalPages(calculatedTotalPages)

      // Adjust current page if needed
      if (currentPage > calculatedTotalPages && calculatedTotalPages > 0) {
        setCurrentPage(1)
      }

      // Step 4: Calculate the current page's thoughts
      const startIndex = (currentPage - 1) * THOUGHTS_PER_PAGE
      const endIndex = Math.min(
        startIndex + THOUGHTS_PER_PAGE,
        myThoughts.length
      )

      if (DEBUG) {
        console.log(
          `Displaying thoughts from index ${startIndex} to ${endIndex - 1}`
        )
      }

      const paginatedThoughts = myThoughts.slice(startIndex, endIndex)
      setFilteredThoughts(paginatedThoughts)

      if (DEBUG) {
        console.log(
          `Page ${currentPage}/${calculatedTotalPages}: displaying ${paginatedThoughts.length} thoughts`
        )
      }
    } catch (e) {
      console.error('Error processing user thoughts:', e)
    } finally {
      setIsLoading(false)
    }
  }, [thoughts, currentUserId, loading, currentPage])

  // Handler for page changes
  const handlePageChange = (newPage) => {
    console.log(`Changing to page ${newPage}`)
    setCurrentPage(newPage)
    window.scrollTo(0, 0) // Scroll to top when changing pages
  }

  // Handler for opening update modal
  const handleOpenUpdateModal = (thought) => {
    // You can implement modal opening logic here
    // For now, we'll pass the updateThought function directly
    updateThought(thought._id, thought.message)
  }

  if (loading || isLoading) {
    return <Loader message='Loading your thoughts...' />
  }

  return (
    <UserThoughtsContainer>
      <Header>Thoughts Created by You</Header>

      {error ? (
        <EmptyState>Error loading thoughts: {error}</EmptyState>
      ) : filteredThoughts.length === 0 ? (
        <EmptyState>You haven't posted any thoughts yet.</EmptyState>
      ) : (
        <>
          <ThoughtCounter
            filteredThoughts={filteredThoughts}
            currentPage={currentPage}
            totalPages={totalPages}
          />
          {/* Map through filtered thoughts */}
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
              onUpdate={updateThought}
            />
          ))}
        </>
      )}

      {/* Only show this pagination UI when there are multiple pages */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </UserThoughtsContainer>
  )
}
