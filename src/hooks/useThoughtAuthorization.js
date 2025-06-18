import { jwtDecode } from 'jwt-decode'

export const useThoughtAuthorization = () => {
  const getCurrentUserId = () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return null

      // Don't try to parse as JSON, decode directly
      const decoded = jwtDecode(token)
      console.log('Auth token decoded:', decoded)

      // Return userId from the decoded token
      return decoded.userId
    } catch (error) {
      console.error('Error getting current user ID:', error)
      return null
    }
  }

  const canUpdateThought = (thought) => {
    const currentUserId = getCurrentUserId()

    // Debug the thought structure
    console.log('Complete thought object:', thought)

    // Check all possible locations of the user ID
    const thoughtUser =
      thought?.userId ||
      thought?.user?._id ||
      thought?.user ||
      thought?.author ||
      thought?.authorId

    const isMatch =
      !!currentUserId && !!thoughtUser && currentUserId === thoughtUser

    console.log('Can update check: ', {
      thoughtUser,
      currentUserId,
      isMatch,
      thoughtObj: thought
    })

    return isMatch
  }

  return { canUpdateThought, getCurrentUserId }
}
