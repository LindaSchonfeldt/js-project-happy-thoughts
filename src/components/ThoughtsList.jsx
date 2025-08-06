import React, { useEffect } from 'react'

import { useAuth } from '../contexts/AuthContext'
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
  const { user, isAuthenticated } = useAuth()

  // Force component updates when auth changes
  const [updateKey, setUpdateKey] = React.useState(0)

  useEffect(() => {
    // Force re-render of all thoughts when auth state changes
    console.log('Auth state changed, updating thought list UI')
    setUpdateKey((prev) => prev + 1)
  }, [user?.userId, isAuthenticated])

  return (
    <>
      {thoughts.map((t) => (
        <Thought
          key={`${t._id}-${updateKey}`} // Add updateKey to force re-render
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
          currentUserId={user?.userId}
          isAuthenticated={isAuthenticated}
        />
      ))}
    </>
  )
}
