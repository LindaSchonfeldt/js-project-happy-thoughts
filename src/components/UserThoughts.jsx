/**
 * UserThoughts Component
 * Purpose: Displays thoughts created by the authenticated user.
 * Usage: Used in user profile and dashboard views.
 * Author: Linda Schonfeldt
 * Last Updated: October 26, 2026
 */
import React, { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'

import { api } from '../api/api'
import { useThoughts } from '../contexts/ThoughtsContext'
import { Loader } from './Loader'
import { Pagination } from './Pagination'
import { Thought } from './Thought'
import { ThoughtCounter } from './ThoughtCounter'
import { UpdateModal } from './UpdateModal'

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

const THOUGHTS_PER_PAGE = 10

export const UserThoughts = () => {
  const [thoughts, setThoughts] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingThought, setUpdatingThought] = useState(null)

  const { deleteThought, updateThought } = useThoughts()

  // Fetch only this user's thoughts from the API (server-side filtering + paging)
  const fetchUserThoughts = useCallback(async (page) => {
    setIsLoading(true)
    setError(null)

    const result = await api.getUserThoughts(page, THOUGHTS_PER_PAGE)

    if (result.success) {
      setThoughts(result.data)
      setTotalPages(result.totalPages || 1)
    } else {
      setThoughts([])
      setError(result.message)
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchUserThoughts(currentPage)
  }, [currentPage, fetchUserThoughts])

  // If the last thought on a page is deleted, step back a page
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
    window.scrollTo(0, 0) // Scroll to top when changing pages
  }

  const handleDelete = async (thoughtId) => {
    const deleted = await deleteThought(thoughtId)
    if (deleted) fetchUserThoughts(currentPage)
  }

  const handleSaveUpdate = async (updateData) => {
    const result = await updateThought(updatingThought._id, updateData)
    if (result.success) fetchUserThoughts(currentPage)
    return result
  }

  if (isLoading) {
    return <Loader message='Loading your thoughts...' />
  }

  return (
    <UserThoughtsContainer>
      <Header>Thoughts Created by You</Header>

      {error ? (
        <EmptyState>Error loading thoughts: {error}</EmptyState>
      ) : thoughts.length === 0 ? (
        <EmptyState>You haven't posted any thoughts yet.</EmptyState>
      ) : (
        <>
          <ThoughtCounter
            filteredThoughts={thoughts}
            currentPage={currentPage}
            totalPages={totalPages}
          />
          {thoughts.map((thought) => (
            <Thought
              key={thought._id}
              _id={thought._id}
              message={thought.message}
              hearts={thought.hearts}
              createdAt={thought.createdAt}
              tags={thought.tags}
              userId={thought.userId}
              username={thought.username}
              isAnonymous={!thought.username}
              onDelete={handleDelete}
              onUpdate={setUpdatingThought}
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

      <UpdateModal
        isOpen={!!updatingThought}
        onClose={() => setUpdatingThought(null)}
        thought={updatingThought}
        onSave={handleSaveUpdate}
      />
    </UserThoughtsContainer>
  )
}
