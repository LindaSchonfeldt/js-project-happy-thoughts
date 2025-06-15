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

  // Show login if no token
  if (!token) {
    return (
      <div className='App'>
        <GlobalStyles />
        <LoginSignup setToken={setToken} />
      </div>
    )
  }

  // Show main app if authenticated
  return (
    <div className='App'>
      <GlobalStyles />
      <LogoutButton onLogout={handleLogout} />
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
