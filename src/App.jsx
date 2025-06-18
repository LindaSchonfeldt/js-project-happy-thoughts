import React, { useState, useEffect } from 'react'
import { GlobalStyles } from './GlobalStyles'
import { ThoughtForm } from './components/ThoughtForm'
import { Thought } from './components/Thought'
import { LikeCounter } from './components/LikeCounter'
import { Pagination } from './components/Pagination'
import { LoginSignup } from './components/LoginSignup'
import { NavBar } from './components/NavBar'
import { useThoughts } from './contexts/ThoughtsContext'
import { Loader } from './components/Loader'
import { UpdateModal } from './components/UpdateModal'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { UserThoughts } from './components/UserThoughts'
import { LikedThoughts } from './components/LikedThoughts'

export const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [showLogin, setShowLogin] = useState(false)
  const [user, setUser] = useState(null)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [updatingThought, setUpdatingThought] = useState(null)

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
    setUpdatingThought(thought)
    setIsUpdateModalOpen(true)
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
    <Router>
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
        <LikeCounter />

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
                tags={thought.tags}
                userId={thought.userId || thought.user?._id || thought.user}
                username={thought.username}
                onDelete={deleteThought}
                onUpdate={handleOpenUpdateModal}
              />
            ))}
          />
          <Route path='/liked-thoughts' element={<LikedThoughts />} />
          {/* Add other routes here as needed */}
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
