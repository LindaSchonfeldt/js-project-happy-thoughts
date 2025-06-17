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

  // Only permissions, NOT handlers
  return {
    canUpdate,
    canDelete,
    checkOwnership
  }
}
