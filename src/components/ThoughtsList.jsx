import { useAuth } from '../contexts/AuthContext'
import styled from 'styled-components'

import { Thought } from './Thought'

export default function ThoughtsList({
  thoughts,
  newThoughtId,
  onDelete,
  onUpdate,
  fetchThoughts,
  currentPage,
  loading
}) {
  const { user, isAuthenticated } = useAuth() // Get current user info

  return (
    <>
      <RefreshButton
        onClick={() => fetchThoughts(currentPage, true)}
        disabled={loading}
      >
        {loading ? 'Refreshing...' : 'Refresh Thoughts'}
      </RefreshButton>
      {thoughts.map((t) => (
        <Thought
          key={t._id}
          _id={t._id}
          message={t.message}
          hearts={t.hearts}
          createdAt={t.createdAt}
          tags={t.tags}
          themeTags={t.themeTags}
          userId={t.userId}
          username={t.username}
          isAnonymous={!t.username}
          isOwn={t.isOwn}
          onDelete={() => onDelete(t._id)}
          onUpdate={() => onUpdate(t)}
          currentUserId={user?.userId} // Pass current user ID
          isAuthenticated={isAuthenticated} // Pass auth status
        />
      ))}
    </>
  )
}

const RefreshButton = styled.button`
  background: #4caf50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  margin-bottom: 16px;
  cursor: pointer;
  font-weight: bold;

  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: #45a049;
  }
`
