import { useLikeSystem } from '../hooks/useLikeSystem'
import { formatDate } from '../utils/dateHelpers'
import { media } from '../media'
import { Button } from './Button'
import styled, { keyframes } from 'styled-components'

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0px);
  }
`

export const ThoughtContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding: 12px 8px;
  width: 300px;
  height: auto;
  background-color: #fff;
  border: 2px solid black;
  box-shadow: 6px 6px 0 0 black;
  margin: 2rem auto;
  font-size: 14px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  overflow: auto;

  animation: ${(props) => (props.$isNew ? fadeIn : 'none')} 0.5s ease-out;

  @media ${media.tablet} {
    width: 400px;
  }
  @media ${media.desktop} {
    width: 500px;
  }
`
export const ThoughtText = styled.p`
  width: 100%;
  height: auto;
  padding: 8px;
`

export const BottomSection = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

export const LikeCounter = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  color: #333;
  font-size: 12px;
`

export const DateText = styled.span`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  color: #999;
  font-size: 11px;
  font-weight: 500;
  margin-left: auto;
`

// Message component to display individual messages with help from:
// useLikeSystem (hook)  for like functionality,
// and dateHelpers (helper) for date formatting

export const Thought = ({
  _id,
  message,
  isNew,
  hearts: init,
  createdAt,
  onDelete
}) => {
  const { isLiked, likeCount, handleLike } = useLikeSystem(_id, init)

  // Format the date for display
  const formattedDate = formatDate(createdAt)

  // Ensure likeCount is properly formatted for display
  const displayLikeCount =
    typeof likeCount === 'object'
      ? likeCount.hearts || 0 // Extract hearts property if it's an object
      : likeCount // Use directly if it's a primitive value

  // Ensure message is properly formatted for display
  const displayMessage =
    typeof message === 'object'
      ? message.message || 'No message content' // Extract message text if it's an object
      : message // Use directly if it's a string

  // Handle delete with confirmation
  const handleDeleteThought = () => {
    if (window.confirm('Are you sure you want to delete this thought?')) {
      onDelete()
    }
  }

  return (
    <ThoughtContainer $isNew={isNew}>
      <ThoughtText>{displayMessage}</ThoughtText>
      <BottomSection>
        <LikeCounter>
          <Button
            variant='icon'
            icon={'❤️'}
            onClick={handleLike}
            isLiked={isLiked}
          />
          <p>{`x ${displayLikeCount}`}</p>
        </LikeCounter>
        <Button variant='icon' icon={'🗑️'} onClick={handleDeleteThought} />
        <DateText>{formattedDate}</DateText>
      </BottomSection>
    </ThoughtContainer>
  )
}
