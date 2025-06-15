import { useState } from 'react'

import { LikeCounter } from './components/LikeCounter'
import { Loader } from './components/Loader'
import { LoginSignup } from './components/LoginSignup'
import { LogoutButton } from './components/LogoutButton'
import Pagination from './components/Pagination'
import { Thought } from './components/Thought'
import { ThoughtForm } from './components/ThoughtForm'
import { GlobalStyles } from './GlobalStyles'
import { useThoughts } from './hooks/useThoughts'

export const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [showLogin, setShowLogin] = useState(false) // Add this state

  const {
    thoughts,
    loading,
    error,
    currentPage,
    totalPages,
    newThoughtId,
    serverStarting,
    setCurrentPage,
    createThought,
    handleDeleteThought
  } = useThoughts()

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setShowLogin(false) // Hide login form after logout
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
    <div className='App'>
      <GlobalStyles />

      {/* Header with auth controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 20px',
          borderBottom: '1px solid #eee',
          marginBottom: '20px'
        }}
      >
        <h1 style={{ margin: 0, fontSize: '24px' }}>Happy Thoughts</h1>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {token ? (
            <>
              <span style={{ fontSize: '14px', color: '#666' }}>
                Welcome back!
              </span>
              <LogoutButton onLogout={handleLogout} />
            </>
          ) : (
            <button
              onClick={() => setShowLogin(!showLogin)}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {showLogin ? 'Hide Login' : 'Login / Sign Up'}
            </button>
          )}
        </div>
      </div>

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

      {/* Main app content - always visible */}
      <ThoughtForm onSubmit={createThought} />
      <LikeCounter />

      {thoughts.map((thought) => (
        <Thought
          key={thought._id}
          _id={thought._id}
          message={thought.message}
          hearts={thought.hearts}
          createdAt={thought.createdAt}
          tags={thought.tags || []}
          isNew={thought._id === newThoughtId}
          onDelete={() => handleDeleteThought(thought._id)}
          canDelete={token} // Only show delete if logged in
        />
      ))}

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(newPage) => {
            console.log('Changing to page:', newPage)
            setCurrentPage(newPage)
          }}
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
  )
}
