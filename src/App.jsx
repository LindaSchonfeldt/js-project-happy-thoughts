import React, { useEffect, useState } from 'react'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'

import { LikedThoughts } from './components/LikedThoughts'
import { Loader } from './components/Loader'
import { LoginSignup } from './components/LoginSignup'
import { NavBar } from './components/NavBar'
import { Pagination } from './components/Pagination'
import { ServiceStatus } from './components/ServiceStatus'
import { Thought } from './components/Thought'
import { ThoughtForm } from './components/ThoughtForm'
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

  const {
    thoughts,
    loading,
    error,
    currentPage,
    totalPages,
    newThoughtId,
    createThought,
    deleteThought,
    updateThought,
    setCurrentPage
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
  const handleSaveThoughtUpdate = async (id, updatedMessage) => {
    try {
      await updateThought(id, updatedMessage)
      setIsUpdateModalOpen(false)
      setUpdatingThought(null)
    } catch (error) {
      console.error('Failed to update thought:', error)
      alert('Failed to update your thought. Please try again.')
    }
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

  // Extract current user ID, trying multiple common field names
  const currentUserId = user?.userId || user?.id || user?._id
  console.log('Current user ID:', currentUserId)

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  // Check server status on mount
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        setServerStarting(true)
        const response = await fetch(
          'https://happy-thoughts-api-yn3p.onrender.com/health'
        )
        if (response.ok) {
          setServerStarting(false)
        }
      } catch (error) {
        console.log('Server may be starting up:', error)
        setServerStarting(true)
      }
    }

    checkServerStatus()

    // Check again after 10 seconds
    const timer = setTimeout(() => {
      setServerStarting(false)
    }, 10000)

    return () => clearTimeout(timer)
  }, [])

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
          onRetry={() => {
            fetchThoughts && fetchThoughts(currentPage)
          }}
        />

        <Routes>
          <Route
            path='/'
            element={thoughts.map((thought) => (
              <Thought
                key={thought._id}
                _id={thought._id}
                message={thought.message}
                hearts={thought.hearts}
                createdAt={thought.createdAt}
                tags={thought.tags || []} // your client‐side hashtags
                themeTags={thought.themeTags || []} // ← pass backend tags here
                userId={thought.userId}
                username={thought.username}
                isNew={thought._id === newThoughtId}
                onDelete={deleteThought}
                onUpdate={handleOpenUpdateModal}
              />
            ))}
          />
          <Route path='/liked-thoughts' element={<LikedThoughts />} />
          <Route path='/user-thoughts' element={<UserThoughts />} />
          <Route path='*' element={<div>Page not found</div>} />{' '}
          {/* Add catch-all route */}
        </Routes>

        <UpdateModal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          initialMessage={updatingThought?.message || ''}
          onSave={(message) =>
            handleSaveThoughtUpdate(updatingThought?._id, message)
          }
        />

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}

        {serverStarting && (
          <div
            style={{
              textAlign: 'center',
              padding: '20px',
              backgroundColor: '#f0f0f0',
              margin: '20px',
              borderRadius: '8px'
            }}
          >
            Our server is waking up... This may take 30-60 seconds.
          </div>
        )}
      </div>
    </Router>
  )
}
