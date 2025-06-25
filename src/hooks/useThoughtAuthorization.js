import { useEffect, useState } from 'react'
import { jwtDecode } from 'jwt-decode'

export const useThoughtAuthorization = (thoughtUserId) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [canEdit, setCanEdit] = useState(false)
  const [isOwn, setIsOwn] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (token) {
      try {
        const decoded = jwtDecode(token)
        const userId = decoded.userId || decoded.id
        setCurrentUser(userId)

        // Check if the thought belongs to the current user
        // Both must exist AND be equal (never match when either is null)
        const userOwnsThought =
          userId && thoughtUserId && userId === thoughtUserId

        setCanEdit(userOwnsThought)
        setIsOwn(userOwnsThought)
      } catch (e) {
        console.error('Error decoding token:', e)
        setCurrentUser(null)
        setCanEdit(false)
        setIsOwn(false)
      }
    } else {
      // User is not logged in, they can't edit any posts
      setCurrentUser(null)
      setCanEdit(false)
      setIsOwn(false)
    }
  }, [thoughtUserId])

  return { currentUser, canEdit, isOwn }
}

export default useThoughtAuthorization
