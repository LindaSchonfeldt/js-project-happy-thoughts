// src/hooks/useThoughtAuthorization.js
import { useMemo } from 'react'

export const useThoughtAuthorization = (currentUserId) => {
  const checkOwnership = useMemo(() => {
    return (thought) => {
      // Anonymous thoughts can't be edited
      if (thought.isAnonymous) return false

      // Must be logged in
      if (!currentUserId) return false

      // Must own the thought
      if (!thought.user) return false

      return currentUserId === thought.user
    }
  }, [currentUserId])

  const canUpdate = (thought) => checkOwnership(thought)
  const canDelete = (thought) => checkOwnership(thought)

  const getPermissions = (thought) => ({
    canEdit: canUpdate(thought),
    canDelete: canDelete(thought),
    canLike: true // Anyone can like
  })

  return {
    canEdit: canUpdate,
    canDelete,
    getPermissions,
    checkOwnership
  }
}
