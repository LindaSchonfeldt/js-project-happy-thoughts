import React from 'react'
import styled, { keyframes } from 'styled-components'

import { useLikeSystem } from '../hooks/useLikeSystem'
import { useThoughtAuthorization } from '../hooks/useThoughtAuthorization'
import { media } from '../media'
import { formatDate } from '../utils/dateHelpers'
import { Button } from './Button'
import { TagList } from './TagList'

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

const ThoughtContainer = styled.div`
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

const MessageSection = styled.p`
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

const ActionRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: flex-start;
  gap: 8px;
  width: 100%;
`

const BottomSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  width: 100%;
`

const LikeCounterStyled = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
`
const StyledUserName = styled.span`
  font-weight: 500;
  font-size: 13px;
  color: #333;
`

export const TimeStamp = styled.span`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  color: #999;
  font-size: 11px;
  font-weight: 500;
  margin-left: auto;
`
export const Thought = ({
  _id,
  message = '', // Add default value to prevent undefined error
  isNew,
  hearts: initialHearts,
  createdAt,
  tags = [],
  themeTags = [],
  userId, // This is the thought creator's ID
  username,
  isAnonymous = true,
  isOwn = false, // ← accept the flag
  onDelete,
  onUpdate,
  currentUserId, // Added currentUserId prop
  isAuthenticated // Added isAuthenticated prop
}) => {
  const { isLiked, likeCount, handleLike } = useLikeSystem(_id, initialHearts)
  const {
    currentUser,
    canEdit: hookCanEdit,
    isOwn: hookIsOwn
  } = useThoughtAuthorization(userId)

  // Get current user ID to compare with thought owner
  const actualCurrentUserId = currentUser || currentUserId

  // Fix type consistency
  const canEdit = React.useMemo(() => {
    // Ensure both values are strings for comparison
    const thoughtUserIdStr = userId?.toString()
    const currentUserIdStr = actualCurrentUserId?.toString()

    console.log('String comparison:', {
      thoughtUserIdStr,
      currentUserIdStr,
      areEqual: thoughtUserIdStr === currentUserIdStr
    })

    if (!isAuthenticated || !currentUserIdStr) {
      return false
    }

    if (!thoughtUserIdStr || thoughtUserIdStr !== currentUserIdStr) {
      return false
    }

    if (!username || username === 'Anonymous') {
      return false
    }

    return true
  }, [userId, actualCurrentUserId, isAuthenticated, username])

  // Add this debug logging in your Thought component
  console.log('Current thought authorization data:', {
    thoughtId: _id,
    thoughtUserId: userId,
    thoughtUsername: username,
    currentUserId: actualCurrentUserId,
    isAuthenticated,
    canEdit,
    'userId === actualCurrentUserId': userId === actualCurrentUserId
  })

  const extractHashtags = (messageText) => {
    if (!messageText || typeof messageText !== 'string') return []

    // Extract hashtags from message content
    const hashtagRegex = /#(\w+)/g
    const matches = messageText.match(hashtagRegex)

    if (!matches) return []
    // Remove the # character
    return matches.map((tag) => tag.slice(1))
  }

  // Add this before the return statement
  const displayMessage =
    typeof message === 'object'
      ? message.message || 'No message content'
      : message

  // Extract hashtags from message content as fallback
  const extractedTags = extractHashtags(displayMessage)

  const handleUpdate = () => {
    if (onUpdate) {
      onUpdate({
        _id,
        message,
        hearts: initialHearts,
        createdAt,
        tags,
        userId,
        username
      })
    }
  }

  const handleDelete = async () => {
    try {
      await onDelete(_id)
    } catch (error) {
      console.error('Error deleting thought:', error)
    }
  }

  // Format stuff for display
  const formattedDate = formatDate(createdAt)
  const displayLikeCount =
    typeof likeCount === 'object' ? likeCount.hearts || 0 : likeCount
  const displayMessageFinal =
    typeof message === 'object'
      ? message.message || 'No message content'
      : message

  return (
    <ThoughtContainer $isNew={isNew}>
      <TopSection>
        <TagList tags={tags?.length ? tags : extractedTags} />
        <TimeStamp>{formattedDate}</TimeStamp>
      </TopSection>

      <MessageSection>{displayMessageFinal}</MessageSection>

      <BottomSection>
        {/* ✅ Use canModify instead of canEdit */}
        {canEdit && (
          <ActionRow>
            <Button variant='danger' onClick={handleDelete} text='Delete' />
            <Button variant='authed' onClick={handleUpdate} text='Update' />
          </ActionRow>
        )}
        <LikeCounterStyled>
          <p>{`${displayLikeCount} x`}</p>
          <Button
            variant='icon'
            icon={'❤️'}
            onClick={handleLike}
            isLiked={isLiked}
          />
        </LikeCounterStyled>
      </BottomSection>
      <StyledUserName>{isAnonymous ? 'Anonymous' : username}</StyledUserName>
      {/* Add this temporarily in your Thought component for debugging */}
      <button
        onClick={() =>
          console.log('Raw thought data:', {
            _id,
            userId,
            username,
            actualCurrentUserId,
            isAuthenticated
          })
        }
      >
        Debug This Thought
      </button>
    </ThoughtContainer>
  )
}
