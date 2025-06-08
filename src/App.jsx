import { Loader } from './components/Loader'
import { ThoughtForm } from './components/ThoughtForm'
import { Thought } from './components/Thought'
import { LikeCounter } from './components/LikeCounter'
import { GlobalStyles } from './GlobalStyles'
import { useThoughts } from './hooks/useThoughts'
import { useState, useEffect } from 'react'
import { api } from './api/api.js'

export const App = () => {
  const { thoughts, loading, error, newThoughtId, createAndRefresh } =
    useThoughts()
  const [serverStarting, setServerStarting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchThoughts = async (page) => {
    const data = await api.getThoughts(page)
    setThoughts(data.response.thoughts)
    setCurrentPage(data.response.currentPage)
    setTotalPages(data.response.totalPages)
  }

  useEffect(() => {
    fetchThoughts(currentPage)
  }, [currentPage])

  if (loading) return <Loader />
  if (error) return <div className='error'>{error}</div>

  return (
    <div className='App'>
      <GlobalStyles />
      {/* on submit we both insert and then re-fetch */}
      <ThoughtForm onSubmit={createAndRefresh} />
      <LikeCounter />
      {thoughts.map((t) => (
        <Thought key={t._id} {...t} isNew={t._id === newThoughtId} />
      ))}
      {serverStarting && (
        <div className='server-starting-message'>
          Our server is waking up... This may take 30-60 seconds.
        </div>
      )}
    </div>
  )
}
