import { useThoughts } from '../contexts/ThoughtsContext'
import { Thought } from './Thought'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'

const LikedThoughtsContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`

const BackButton = styled.button`
  margin-bottom: 20px;
  padding: 8px 16px;
  background-color: #f8f8f8;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #eaeaea;
  }
`

const Header = styled.h1`
  text-align: center;
  margin-bottom: 20px;
`

export const LikedThoughts = () => {
  const { likedThoughts, loading, error, deleteThought, updateThought } = useThoughts();
  const navigate = useNavigate();

  // Add a handler if you need to open a modal
  const handleOpenUpdateModal = (thought) => {
    // Modal opening logic here
  };

  return (
    <LikedThoughtsContainer>
      <BackButton onClick={() => navigate('/')}>
        Back to All Thoughts
      </BackButton>
      <Header>Thoughts You've Liked</Header>

      {loading ? (
        <p>Loading your liked thoughts...</p>
      ) : error ? (
        <p>Error loading thoughts: {error}</p>
      ) : likedThoughts.length === 0 ? (
        <p>You haven't liked any thoughts yet.</p>
      ) : (
        likedThoughts.map((thought) => (
          <Thought 
            key={thought._id}
            _id={thought._id}
            message={thought.message}
            hearts={thought.hearts}
            createdAt={thought.createdAt}
            tags={thought.tags}
            userId={thought.userId || thought.user?._id || thought.user}
            username={thought.username}
            onDelete={deleteThought}
            onUpdate={handleOpenUpdateModal}
          />
        ))
      )}
    </LikedThoughtsContainer>
  );
};