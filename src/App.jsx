import { Loader } from './components/Loader'
import { ThoughtForm } from './components/ThoughtForm'
import { Thought } from './components/Thought'
import { LikeCounter } from './components/LikeCounter'
import { GlobalStyles } from './GlobalStyles'
import { useThoughts } from './hooks/useThoughts'

export const App = () => {
  const { thoughts, loading, error, newThoughtId, createAndRefresh } =
    useThoughts()

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
    </div>
  )
}
