import { useMemo } from 'react'

export const useThoughtAuthorization = (currentUserId) => {
  console.log('Authorization with user ID:', currentUserId)

  const checkOwnership = (thought) => {
    // Safety check for undefined values
    if (!thought || !thought.user || !currentUserId) return false
    if (thought.isAnonymous) return false

    return currentUserId === thought.user
  }

  const canUpdate = checkOwnership
  const canDelete = checkOwnership

  return {
    canUpdate,
    canDelete
  }
}
