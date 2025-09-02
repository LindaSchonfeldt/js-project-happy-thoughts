/**
 * UserContext
 * Purpose: Provides user profile state and logic via React Context API.
 * Usage: Used by components to access user data and actions.
 * Author: Linda Schonfeldt
 * Last Updated: September 2, 2025
 */
import { createContext, useEffect, useState } from 'react'

export const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        // Decode the payload without any library
        const [, payload] = token.split('.')
        const { userId } = JSON.parse(atob(payload))
        setCurrentUser(userId)
      } catch (err) {
        console.error('Invalid token:', err)
      }
    }
  }, [])

  return (
    <UserContext.Provider value={{ currentUser }}>
      {children}
    </UserContext.Provider>
  )
}

export default UserContext
