import { Loader } from './Loader'

export const UserPosts = ({ userId, thoughts, handleDeleteThought }) => {
  // Filter thoughts by userId
  const userThoughts = thoughts.filter((thought) => thought.userId === userId)

  // If thoughts are still loading, show a loading message
  if (!thoughts) {
    return (
      <Loader
        $fullScreen={true}
        $transparent={true}
        $padding='0'
        message='Loading user posts...'
      />
    )
  }

  // If no thoughts found for the user, return a message
  if (userThoughts.length === 0) {
    return <p>No posts found for this user.</p>
  }

  return (
    <div>
      {userThoughts.map((thought) => (
        <Thought
          key={thought._id}
          {...thought}
          onDelete={() => handleDeleteThought(thought._id)}
        />
      ))}
    </div>
  )
}
