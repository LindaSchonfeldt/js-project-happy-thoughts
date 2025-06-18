import { jwtDecode } from 'jwt-decode'

export const useThoughtAuthorization = () => {
  const getToken = () => localStorage.getItem('token')

  const getCurrentUserId = () => {
    const token = getToken()
    if (!token) return null

    try {
      const decoded = jwtDecode(token)
      return decoded.userId
    } catch (error) {
      console.error('Error decoding token:', error)
      return null
    }
  }

  const canUpdateThought = (thought) => {
    if (!thought) return false

    const thoughtUserId = thought.userId
    const currentUserId = getCurrentUserId()

    return Boolean(
      thoughtUserId && currentUserId && thoughtUserId === currentUserId
    )
  }

  return {
    canUpdateThought,
    getCurrentUserId
  }
}

export default useThoughtAuthorization
