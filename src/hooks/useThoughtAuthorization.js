import { useMemo } from 'react'

export const useThoughtAuthorization = (currentUserId) => {
  console.log('Authorization with user ID:', currentUserId)

  const checkOwnership = (thought) => {
    // Add detailed logging
    console.log('Checking ownership:', {
      thought,
      currentUserId,
      isAnonymous: thought.isAnonymous,
      thoughtUser: thought.user,
      match: currentUserId === thought.user
    })

    if (!currentUserId) return false
    if (thought.isAnonymous) return false
    if (!thought.user) return false

    return currentUserId === thought.user
  }

  const canUpdate = checkOwnership
  const canDelete = checkOwnership

  return {
    canUpdate,
    canDelete
  }
}
