import { Thought } from './Thought'
import styled from 'styled-components'

export const ThoughtsList = ({
  thoughts,
  newThoughtId,
  onDelete,
  fetchThoughts,
  currentPage,
  loading
}) => {
  return (
    <>
      <RefreshButton
        onClick={() => fetchThoughts(currentPage, true)}
        disabled={loading}
      >
        {loading ? 'Refreshing...' : 'Refresh Thoughts'}
      </RefreshButton>
      {thoughts.map((thought) => (
        <Thought
          key={thought._id}
          _id={thought._id}
          message={thought.message}
          hearts={thought.hearts}
          createdAt={thought.createdAt}
          tags={thought.tags || []}
          isNew={thought._id === newThoughtId}
          onDelete={() => onDelete(thought._id)}
        />
      ))}
    </>
  )
}

const RefreshButton = styled.button`
  background: #4caf50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  margin-bottom: 16px;
  cursor: pointer;
  font-weight: bold;

  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: #45a049;
  }
`
