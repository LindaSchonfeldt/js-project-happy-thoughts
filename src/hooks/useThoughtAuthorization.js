import { useContext } from 'react'
import UserContext from '../contexts/UserContext'

export function useThoughtAuthorization(thoughtUserId) {
  const { currentUser } = useContext(UserContext)
  const isOwn = currentUser === thoughtUserId
  const canEdit = Boolean(isOwn && currentUser)
  return { currentUser, isOwn, canEdit }
}

export default useThoughtAuthorization
