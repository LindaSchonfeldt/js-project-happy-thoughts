import { Loader } from './components/Loader'
import { ThoughtForm } from './components/ThoughtForm'
import { Thought } from './components/Thought'
import { LikeCounter } from './components/LikeCounter'
import { GlobalStyles } from './GlobalStyles'
import { useThoughts } from './hooks/useThoughts'
import { useState } from 'react'
import LottieAnimation from './components/LottieAnimation'

export const App = () => {
  const { thoughts, loading, error, newThoughtId, createAndRefresh } = useThoughts()
  const [serverStarting, setServerStarting] = useState(false)

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
        <div className="server-starting-message">
          Our server is waking up... This may take 30-60 seconds.
          <LottieAnimation />
        </div>
      )}
    </div>
  )
}
