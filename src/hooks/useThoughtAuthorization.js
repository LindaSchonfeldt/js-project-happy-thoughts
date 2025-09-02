/**
 * useThoughtAuthorization Hook
 * Purpose: Custom React hook for handling thought authorization logic.
 * Usage: Used by components to check user permissions for thoughts.
 * Author: Linda Schonfeldt
 * Last Updated: September 2, 2025
 */
import { useContext } from 'react'
import UserContext from '../contexts/UserContext'

export function useThoughtAuthorization(thoughtUserId) {
  const { currentUser } = useContext(UserContext)
  const isOwn = currentUser === thoughtUserId
  const canEdit = Boolean(isOwn && currentUser)
  return { currentUser, isOwn, canEdit }
}

export default useThoughtAuthorization
