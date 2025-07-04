import React, { useEffect, useState } from 'react'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'

import { LikedThoughts } from './components/LikedThoughts'
import { Loader } from './components/Loader'
import { LoginSignup } from './components/LoginSignup'
import { NavBar } from './components/NavBar'
import { Notification } from './components/Notification'
import { Pagination } from './components/Pagination'
import { ServiceStatus } from './components/ServiceStatus'
import ThoughtForm from './components/ThoughtForm'
import ThoughtsList from './components/ThoughtsList'
import { UpdateModal } from './components/UpdateModal'
import { UserThoughts } from './components/UserThoughts'
import { useThoughts } from './contexts/ThoughtsContext'
import { GlobalStyles } from './GlobalStyles'

export const App = () => {
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

  // IMPORTANT: Destructure ALL these values from context
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
    setNotification // Add this line to fix the error
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

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
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

  // Always show main app (no login gate!)
  return (
    <Router basename='/'>
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
            <LoginSignup
              setToken={(newToken) => {
                setToken(newToken)
                setShowLogin(false) // Hide login after successful login
              }}
            />
          </div>
        )}

        <ThoughtForm onSubmit={createThought} />
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
    </Router>
  )
}
