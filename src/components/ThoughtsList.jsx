import { Thought } from './Thought'

export const ThoughtsList = ({ thoughts, newThoughtId, onDelete }) => {
  return (
    <>
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
