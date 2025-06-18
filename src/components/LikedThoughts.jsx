import React, { useEffect } from 'react'
import { useThoughts } from '../contexts/ThoughtsContext'
import { Thought } from './Thought'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { Loader } from './Loader'

const LikedThoughtsContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`

const BackButton = styled.button`
  margin-bottom: 20px;
  padding: 8px 16px;
  background-color: #f8f8f8;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #eaeaea;
  }
`

const Header = styled.h1`
  text-align: center;
  margin-bottom: 20px;
`

const EmptyState = styled.p`
  text-align: center;
  color: #888;
`

export const LikedThoughts = () => {
  const {
    thoughts,
    likedThoughts,
    loading,
    error,
    fetchLikedThoughts,
    deleteThought,
    updateThought
  } = useThoughts()
  const navigate = useNavigate()

  useEffect(() => {
    // Fetch liked thoughts when component mounts
    fetchLikedThoughts()
  }, [fetchLikedThoughts])

  // Fallback to localStorage if API fails
  const getFallbackLikedThoughts = () => {
    try {
      // Get liked post IDs from localStorage
      const likedIds = JSON.parse(localStorage.getItem('likedPosts') || '[]')

      // Filter all thoughts to show only liked ones
      return thoughts.filter((thought) => likedIds.includes(thought._id))
    } catch (e) {
      console.error('Error getting fallback liked thoughts:', e)
      return []
    }
  }

  // Use API results if available, otherwise use fallback
  const thoughtsToDisplay =
    likedThoughts.length > 0 ? likedThoughts : getFallbackLikedThoughts()

  // Handler for opening update modal
  const handleOpenUpdateModal = (thought) => {
    // Implementation for opening update modal
  }

  if (loading) {
    return <Loader message='Loading your liked thoughts...' />
  }

  return (
    <LikedThoughtsContainer>
      <BackButton onClick={() => navigate('/')}>
        Back to All Thoughts
      </BackButton>
      <Header>Thoughts You've Liked</Header>

      {error ? (
        <EmptyState>Error loading thoughts: {error}</EmptyState>
      ) : thoughtsToDisplay.length === 0 ? (
        <EmptyState>You haven't liked any thoughts yet.</EmptyState>
      ) : (
        thoughtsToDisplay.map((thought) => (
          <Thought
            key={thought._id}
            _id={thought._id}
            message={thought.message}
            hearts={thought.hearts}
            createdAt={thought.createdAt}
            tags={thought.tags}
            userId={thought.userId || thought.user?._id || thought.user}
            username={thought.username}
            onDelete={deleteThought}
            onUpdate={handleOpenUpdateModal}
          />
        ))
      )}
    </LikedThoughtsContainer>
  )
}
