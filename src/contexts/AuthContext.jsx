/**
 * AuthContext
 * Purpose: Provides authentication state and logic via React Context API.
 * Usage: Used by components to access user authentication info.
 * Author: Linda Schonfeldt
 * Last Updated: September 2, 2025
 */
import React, { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authChangeTimestamp, setAuthChangeTimestamp] = useState(Date.now())

  // Initialize auth state from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        // Decode token to get user info
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        )
        const decoded = JSON.parse(jsonPayload)

        setUser({
          userId: decoded.userId || decoded.id || decoded.sub,
          username: decoded.username
        })
        setIsAuthenticated(true)
        setAuthChangeTimestamp(Date.now()) // ✅ UPDATE TIMESTAMP
      } catch (error) {
        console.error('Error decoding token:', error)
        localStorage.removeItem('token')
      }
    }
  }, [])

  const login = async (userData, token) => {
    console.log('AuthContext: Setting login state', userData)

    // Store token
    localStorage.setItem('token', token)

    // Set auth state
    setUser(userData)
    setIsAuthenticated(true)
    setAuthChangeTimestamp(Date.now()) // ✅ FORCE RE-RENDER

    console.log('AuthContext: Login state updated')
  }

  const logout = () => {
    console.log('AuthContext: Logging out')

    // Clear storage
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')

    // Clear state
    setUser(null)
    setIsAuthenticated(false)
    setAuthChangeTimestamp(Date.now()) // ✅ FORCE RE-RENDER

    console.log('AuthContext: Logout complete')
  }

  const value = {
    user,
    isAuthenticated,
    authChangeTimestamp, // ✅ EXPOSE TIMESTAMP
    login,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
