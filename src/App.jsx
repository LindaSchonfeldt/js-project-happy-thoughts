import { useEffect, useState } from 'react'

import { api } from './api/api'
import { LikeCounter } from './components/LikeCounter'
import { Loader } from './components/Loader'
import Pagination from './components/Pagination'
import { Thought } from './components/Thought'
import { ThoughtForm } from './components/ThoughtForm'
import { GlobalStyles } from './GlobalStyles'

export const App = () => {
  const [thoughts, setThoughts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [newThoughtId, setNewThoughtId] = useState(null)
  const [serverStarting, setServerStarting] = useState(false)

  const fetchThoughts = async (page = 1) => {
    try {
      console.log('fetchThoughts called with page:', page)
      setLoading(true)
      setError(null)

      const data = await api.getThoughts(page)

      // Add detailed logging
      console.log('=== FULL API RESPONSE ===')
      console.log('data:', data)
      console.log('data.response:', data.response)
      console.log('data.response.pagination:', data.response.pagination)
      console.log('========================')

      if (data.success) {
        const thoughtsList = data.response.thoughts || []
        const paginationData = data.response.pagination || {}

        // Log each step
        console.log('thoughtsList length:', thoughtsList.length)
        console.log('paginationData:', paginationData)
        console.log('paginationData.current:', paginationData.current)
        console.log('paginationData.pages:', paginationData.pages)
        console.log('paginationData.total:', paginationData.total)

        setThoughts(thoughtsList)
        setCurrentPage(paginationData.current || page)
        setTotalPages(paginationData.pages || 1)

        console.log(
          'State updated - currentPage should be:',
          paginationData.current
        )
        console.log(
          'State updated - totalPages should be:',
          paginationData.pages
        )
      } else {
        console.log('API response not successful:', data)
      }
    } catch (err) {
      console.error('Error fetching thoughts:', err)
      setError('Failed to load thoughts')
    } finally {
      setLoading(false)
    }
  }

  // Function to create a new thought and update local state
  const createAndRefresh = async (message) => {
    try {
      console.log(
        'Creating thought with message:',
        message,
        'Type:',
        typeof message
      )

      const result = await api.postThought(message)
      console.log('Post thought result:', result)

      if (result.success) {
        const newThought = result.response
        setNewThoughtId(newThought._id)
        console.log('New thought ID set:', newThought._id)

        // Add the new thought to the TOP of the existing list
        setThoughts((prevThoughts) => [newThought, ...prevThoughts])

        // Update current page to 1 if we're on a different page
        if (currentPage !== 1) {
          setCurrentPage(1)
          // The useEffect will handle fetching page 1 data
        }
        // If we're already on page 1, no need to fetch again since we added locally

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
          tags={thought.tags || []}
          isNew={thought._id === newThoughtId}
          onDelete={() => handleDeleteThought(thought._id)}
        />
      ))}

      {/* Add Pagination - only show if more than 1 page */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(newPage) => {
            console.log('Changing to page:', newPage)
            setCurrentPage(newPage) // This will trigger useEffect that fetches thoughts
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
