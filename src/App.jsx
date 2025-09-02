/**
 * App Component
 * Purpose: Main React component for Happy Thoughts frontend.
 * Usage: Root component rendered by main.jsx.
 * Author: Linda Schonfeldt
 * Last Updated: September 2, 2025
 */
import React, { useEffect, useState } from 'react'
import { Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom'

import { LikedThoughts } from './components/LikedThoughts'
import { Loader } from './components/Loader'
import { Login } from './components/Login'
import { NavBar } from './components/NavBar'
import { NavigationTabs } from './components/NavigationTabs'
import { Notification } from './components/Notification'
import { Pagination } from './components/Pagination'
import { ServiceStatus } from './components/ServiceStatus'
import ThoughtForm from './components/ThoughtForm'
import ThoughtsList from './components/ThoughtsList'
import { UpdateModal } from './components/UpdateModal'
import { UserThoughts } from './components/UserThoughts'
import { AuthProvider } from './contexts/AuthContext'
import { useThoughts } from './contexts/ThoughtsContext'
import { GlobalStyles } from './GlobalStyles'

// Create an inner component that has access to location
const AppContent = () => {
  const location = useLocation() // Get current location for conditional rendering

  const [token, setToken] = useState(localStorage.getItem('token'))
  const [showLogin, setShowLogin] = useState(false)
  const [user, setUser] = useState(null)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [updatingThought, setUpdatingThought] = useState(null)
  const [serverStarting, setServerStarting] = useState(false)
  const [apiStartupState, setApiStartupState] = useState({
    isStarting: true,
    startTime: Date.now(),
    retryCount: 0
  })

  const {
    thoughts,
    loading,
    error,
    currentPage,
    totalPages,
    setCurrentPage,
    newThoughtId,
    createThought,
    deleteThought,
    updateThought,
    fetchThoughts,
    notification,
    setNotification,
    refreshThoughtsOnAuthChange,
    resetToFirstPageOnLogin
  } = useThoughts()

  // Opens the update modal when a thought is selected for editing
  const handleOpenUpdateModal = (thought) => {
    // Check if thought exists and has required properties
    if (thought && thought._id) {
      console.log('Opening update modal for thought:', thought)
      setUpdatingThought(thought)
      setIsUpdateModalOpen(true)
    } else {
      console.error('Cannot update thought: Invalid thought object', thought)
    }
  }

  // Saves the updated thought when modal form is submitted
  const handleSaveThoughtUpdate = async (updateData) => {
    // Debug the parameters
    console.log('App: Saving update with:', {
      thoughtId: updatingThought?._id,
      updateData
    })

    if (!updatingThought || !updatingThought._id) {
      console.error('No thought selected or missing ID')
      return { success: false }
    }

    // Make sure both parameters are passed correctly
    return await updateThought(updatingThought._id, updateData)
  }

  // Extract user info from token on mount or when token changes
  useEffect(() => {
    if (token) {
      try {
        // Basic JWT decode to get user info
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            })
            .join('')
        )

        const decoded = JSON.parse(jsonPayload)
        setUser(decoded) // Store the user object
        console.log('Decoded token user:', decoded)
      } catch (error) {
        console.error('Error decoding token:', error)
      }
    }
  }, [token])

  const currentUserId = user?.userId || user?.id || user?._id

  // Only log when the user object changes
  useEffect(() => {
    if (currentUserId) {
      console.log('Current user ID:', currentUserId)
    }
  }, [currentUserId])

  const handleLogout = async () => {
    console.log('Logging out and refreshing thoughts')

    // Clear auth data
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)

    // Force immediate UI update + refresh thoughts
    setTimeout(async () => {
      // safe call: only call if function exists
      if (typeof refreshThoughtsOnAuthChange === 'function') {
        refreshThoughtsOnAuthChange()
      } else {
        console.warn(
          'refreshThoughtsOnAuthChange is not a function, skipping refresh'
        )
      }
    }, 0) // Execute after state updates

    console.log('Logout complete, thoughts refreshed')
  }

  const handleLoginSuccess = async (authData) => {
    console.log('Login successful, updating auth state and refreshing thoughts')

    // Set auth data
    setToken(authData.token)
    setUser(authData.user)
    localStorage.setItem('token', authData.token)

    // Close login modal
    setShowLogin(false)

    // Check if function exists before calling
    try {
      // Force immediate UI update + refresh thoughts
      setTimeout(async () => {
        if (
          resetToFirstPageOnLogin &&
          typeof resetToFirstPageOnLogin === 'function'
        ) {
          await resetToFirstPageOnLogin()
        }
      }, 0) // Execute after state updates

      console.log('Login complete, thoughts refreshed')
    } catch (error) {
      console.error('Error in handleLoginSuccess:', error)
    }
  }

  // Check server status on mount
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        setApiStartupState((prev) => ({
          ...prev,
          isStarting: true,
          retryCount: prev.retryCount + 1
        }))

        const response = await fetch(
          'https://happy-thoughts-api-yn3p.onrender.com/health',
          { timeout: 5000 }
        )

        if (response.ok) {
          setApiStartupState((prev) => ({
            ...prev,
            isStarting: false
          }))
        }
      } catch (error) {
        console.log('API server cold start detected:', error)

        // Only keep checking for a reasonable amount of time (2 minutes)
        const elapsedTime = Date.now() - apiStartupState.startTime
        if (elapsedTime < 120000) {
          setTimeout(checkServerStatus, 5000)
        } else {
          // Give up after 2 minutes
          setApiStartupState((prev) => ({
            ...prev,
            isStarting: false,
            timedOut: true
          }))
        }
      }
    }

    checkServerStatus()
  }, [])

  // Add a clear message for users during API cold starts
  if (apiStartupState.isStarting) {
    return (
      <Loader
        message={`The API server is starting up. This may take up to 60 seconds for free-tier hosting. (Attempt ${apiStartupState.retryCount})`}
        showTimedMessage={true}
        loadingTime={10000}
        timedMessage='This is taking longer than usual. Free-tier servers can take up to 60 seconds to start...'
      />
    )
  }

  // Show loader while loading
  if (loading) {
    return (
      <Loader
        $fullScreen={true}
        $transparent={false}
        $padding='0'
        message='Loading your thoughts...'
      />
    )
  }

  // Show error message if there's an error
  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '18px',
          color: 'red'
        }}
      >
        {error}
      </div>
    )
  }

  return (
    <div className='App'>
      <GlobalStyles />

      <NavBar
        token={token}
        showLogin={showLogin}
        setShowLogin={setShowLogin}
        handleLogout={handleLogout}
      />

      {/* Show login form if requested and not logged in */}
      {showLogin && !token && (
        <div style={{ marginBottom: '30px' }}>
          <Login
            setToken={(newToken) => {
              setToken(newToken)
              setShowLogin(false) // Hide login after successful login
            }}
            onLoginSuccess={handleLoginSuccess}
          />
        </div>
      )}

      <NavigationTabs />
      {location.pathname === '/' && <ThoughtForm onSubmit={createThought} />}
      <ServiceStatus
        error={error}
        isLoading={loading && !serverStarting}
        onRetry={() => fetchThoughts(currentPage)}
      />

      {/* Show the notification if it exists */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <Routes>
        <Route
          path='/'
          element={
            <ThoughtsList
              thoughts={thoughts}
              newThoughtId={newThoughtId}
              onDelete={deleteThought}
              onUpdate={handleOpenUpdateModal}
              fetchThoughts={fetchThoughts}
              currentPage={currentPage}
              loading={loading}
            />
          }
        />
        <Route path='/liked-thoughts' element={<LikedThoughts />} />
        <Route path='/user-thoughts' element={<UserThoughts />} />
        <Route path='*' element={<div>Page not found</div>} />{' '}
        {/* Add catch-all route */}
      </Routes>

      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        thought={updatingThought} // Ensure this contains the complete thought object
        onSave={handleSaveThoughtUpdate}
      />

      {/* Only show main pagination on the home route */}
      {location.pathname === '/' && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}

// Main App component wraps everything in Router
export const App = () => {
  return (
    <AuthProvider>
      <Router basename='/'>
        <AppContent /> {/* Moved all content here */}
      </Router>
    </AuthProvider>
  )
}

export default App
