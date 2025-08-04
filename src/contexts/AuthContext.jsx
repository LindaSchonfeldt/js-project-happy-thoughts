import React, { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // Initialize auth state from localStorage on app start
  useEffect(() => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        // Decode JWT to get user info
        const payload = JSON.parse(atob(token.split('.')[1]))

        // Check if token is not expired
        if (payload.exp * 1000 > Date.now()) {
          setUser({
            userId: payload.userId,
            username: payload.username
          })
          setIsAuthenticated(true)
        } else {
          // Token expired, remove it
          localStorage.removeItem('token')
        }
      }
    } catch (error) {
      console.error('Error loading auth state:', error)
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }, [])

  const login = async (userData, token) => {
    setUser(userData)
    setIsAuthenticated(true)
    localStorage.setItem('token', token)
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('token')
  }

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
