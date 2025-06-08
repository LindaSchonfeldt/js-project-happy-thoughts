import { useState, useEffect } from 'react'
import { api } from './api/api'
import { Loader } from './components/Loader'
import { ThoughtForm } from './components/ThoughtForm'
import { Thought } from './components/Thought'
import { LikeCounter } from './components/LikeCounter'
import { GlobalStyles } from './GlobalStyles'
import Pagination from './components/Pagination'

export const App = () => {
  const [thoughts, setThoughts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [newThoughtId, setNewThoughtId] = useState(null)
  const [serverStarting, setServerStarting] = useState(false)

  // Function to fetch thoughts (this is what was missing!)
  const fetchThoughts = async (page = 1) => {
    try {
      setLoading(true)
      setError(null)

      const data = await api.getThoughts(page)

      if (data.success) {
        setThoughts(data.response.thoughts || data.response || [])
        setCurrentPage(data.response.currentPage || page)
        setTotalPages(data.response.totalPages || 1)
      }
    } catch (err) {
      console.error('Error fetching thoughts:', err)
      setError('Failed to load thoughts')

      // If it's a connection error, show server starting message
      if (err.message.includes('fetch')) {
        setServerStarting(true)
      }
    } finally {
      setLoading(false)
    }
  }

  // Function to create a new thought and refresh the list
  const createAndRefresh = async (message) => {
    try {
      console.log(
        'Creating thought with message:',
        message,
        'Type:',
        typeof message
      )

      const result = await api.postThought(message)
      console.log('Post thought result:', result) // Debug log

      if (result.success) {
        setNewThoughtId(result.response._id)
        console.log('New thought ID set:', result.response._id) // Debug log

        // Refresh thoughts list
        console.log('Refreshing thoughts list...') // Debug log
        await fetchThoughts(1)

        // Clear the new thought highlight after 3 seconds
        setTimeout(() => {
          setNewThoughtId(null)
        }, 3000)
      } else {
        console.error('Post thought failed:', result)
        setError('Failed to create thought')
      }
    } catch (err) {
      console.error('Error creating thought:', err)
      setError('Failed to create thought: ' + err.message)
    }
  }

  // Function to delete a thought
  const handleDeleteThought = async (thoughtId) => {
    try {
      await api.deleteThought(thoughtId)
      // Remove the thought from the local state
      setThoughts((prevThoughts) =>
        prevThoughts.filter((thought) => thought._id !== thoughtId)
      )
    } catch (err) {
      console.error('Error deleting thought:', err)
      setError('Failed to delete thought')
    }
  }

  // Fetch thoughts when component mounts or page changes
  useEffect(() => {
    fetchThoughts(currentPage)
  }, [currentPage])

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
      <ThoughtForm onSubmit={createAndRefresh} />
      <LikeCounter />
      {thoughts.map((thought) => (
        <Thought
          key={thought._id}
          _id={thought._id}
          message={thought.message}
          hearts={thought.hearts}
          createdAt={thought.createdAt}
          isNew={thought._id === newThoughtId}
          onDelete={() => handleDeleteThought(thought._id)}
        />
      ))}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
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
