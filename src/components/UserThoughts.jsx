import React from 'react'
import { useThoughts } from '../contexts/ThoughtsContext'
import { Thought } from './Thought'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { Loader } from './Loader'

const UserThoughtsContainer = styled.div`
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
  margin: 40px 0;
  color: #666;
`

export const UserThoughts = () => {
  console.log('UserThoughts component rendering')

  const { thoughts, loading, error, deleteThought, updateThought } =
    useThoughts()
  const navigate = useNavigate()

  // Get current user ID from token
  const getCurrentUserId = () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return null

      // Basic JWT decode
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )

      const decoded = JSON.parse(jsonPayload)
      return decoded.userId
    } catch (error) {
      console.error('Error getting current user ID:', error)
      return null
    }
  }

  const currentUserId = getCurrentUserId()

  // Filter thoughts to only include those created by the current user
  const userThoughts = thoughts.filter((thought) => {
    const thoughtUserId = thought.userId || thought.user?._id || thought.user
    return thoughtUserId === currentUserId
  })

  // Handler for opening update modal
  const handleOpenUpdateModal = (thought) => {
    // You can implement modal opening logic here
    // For now, we'll pass the updateThought function directly
    updateThought(thought._id, thought.message)
  }

  if (loading) {
    return <Loader message='Loading your thoughts...' />
  }

  return (
    <UserThoughtsContainer>
      <BackButton onClick={() => navigate('/')}>
        Back to All Thoughts
      </BackButton>
      <Header>My Thoughts</Header>

      {error ? (
        <EmptyState>Error loading thoughts: {error}</EmptyState>
      ) : userThoughts.length === 0 ? (
        <EmptyState>You haven't posted any thoughts yet.</EmptyState>
      ) : (
        userThoughts.map((thought) => (
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
    </UserThoughtsContainer>
  )
}
