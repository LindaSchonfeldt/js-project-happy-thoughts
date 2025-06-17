import styled, { keyframes } from 'styled-components'

import { useLikeSystem } from '../hooks/useLikeSystem'
import { useThoughtAuthorization } from '../hooks/useThoughtAuthorization'
import { media } from '../media'
import { formatDate } from '../utils/dateHelpers'
import { Button } from './Button'

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
const Tag = styled.span`
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 10px;
  color: #666;
  font-weight: 500;
  text-transform: lowercase;

  &:before {
    content: '#';
    color: #999;
  }
`
const Tags = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  margin-bottom: 8px;
  flex-wrap: wrap; /* Allow tags to wrap to next line */
`

const ThoughtText = styled.p`
  width: 100%;
  height: auto;
  padding: 16px 4px 16px 4px;
`
const TopSection = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
`
const BottomSection = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
  width: 100%;
`

const LikeCounter = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  color: #333;
  font-size: 12px;
`
const EditButton = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 8px;
`

export const DateText = styled.span`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
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
  hearts: initialHearts,
  createdAt,
  tags,
  authorId = null,
  isAnonymous = true,
  onDelete,
  onUpdate,
  currentUserId
}) => {
  const { isLiked, likeCount, handleLike } = useLikeSystem(_id, initialHearts)
  const { canUpdate, canDelete } = useThoughtAuthorization(currentUserId)

  // Get permissions for this specific thought
  const thoughtPermissions = {
    canUpdate: canUpdate({ user: authorId, isAnonymous }), // ← Using canUpdate
    canDelete: canDelete({ user: authorId, isAnonymous })
  }

  // For edit/update functionality
  const handleUpdateThought = () => {
    if (!thoughtPermissions.canUpdate) {
      alert('You can only edit your own thoughts')
      return
    }

    // Your edit implementation
    onUpdate(_id, 'New message')
  }

  // For delete functionality
  const handleDeleteThought = () => {
    if (!thoughtPermissions.canDelete) {
      alert('You can only delete your own thoughts')
      return
    }

    if (window.confirm('Are you sure you want to delete this thought?')) {
      onDelete(_id)
    }
  }

  const formattedDate = formatDate(createdAt)

  const displayLikeCount =
    typeof likeCount === 'object' ? likeCount.hearts || 0 : likeCount

  const displayMessage =
    typeof message === 'object'
      ? message.message || 'No message content'
      : message

  return (
    <ThoughtContainer $isNew={isNew}>
      <TopSection>
        <Tags>
          {tags &&
            tags.length > 0 &&
            tags.map((tag, index) => <Tag key={index}>{tag}</Tag>)}
        </Tags>
        {/* Only show edit button if user owns the thought */}
        {thoughtPermissions.canUpdate && (
          <Button variant='authed' text='Edit' onClick={handleUpdateThought} />
        )}
      </TopSection>

      <ThoughtText>{displayMessage}</ThoughtText>

      <BottomSection>
        <EditButton>
          {/* Only show delete button if user owns the thought */}
          {thoughtPermissions.canDelete && (
            <Button
              variant='authed'
              text='Delete'
              onClick={handleDeleteThought}
            />
          )}
        </EditButton>

        <LikeCounter>
          <p>{`${displayLikeCount} x`}</p>
          <Button
            variant='icon'
            icon={'❤️'}
            onClick={handleLike}
            isLiked={isLiked}
          />
        </LikeCounter>
      </BottomSection>

      <DateText>{formattedDate}</DateText>
    </ThoughtContainer>
  )
}
