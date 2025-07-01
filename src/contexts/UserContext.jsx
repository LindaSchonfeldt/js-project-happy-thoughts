import { createContext, useState, useEffect } from 'react'

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
