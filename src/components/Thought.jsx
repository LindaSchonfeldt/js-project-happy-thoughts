import styled, { keyframes } from 'styled-components'
import React from 'react'

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
  font-weight: 600;
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
  onUpdate
}) => {
  const { isLiked, likeCount, handleLike } = useLikeSystem(_id, initialHearts)
  const {
    currentUser,
    canEdit: hookCanEdit,
    isOwn: hookIsOwn
  } = useThoughtAuthorization(userId)

  // Get current user ID to compare with thought owner
  const currentUserId = currentUser

  const isSessionOwner = React.useMemo(() => {
    // Check if this thought ID is in the session storage list of thoughts created by this user
    const sessionThoughts = JSON.parse(
      sessionStorage.getItem('myCreatedThoughts') || '[]'
    )
    return sessionThoughts.includes(_id)
  }, [_id])

  // Update the canEdit check:
  const canEdit = Boolean(
    // Case 1: Specific user-owned thoughts (non-anonymous)
    (userId && currentUserId && userId === currentUserId) ||
      // Case 2: Session-owned anonymous thoughts
      (isAnonymous === true && isSessionOwner) ||
      // Case 3: Legacy support for isOwn flag
      isOwn === true ||
      hookIsOwn === true
  )

  // Log for debugging - include more clear ownership information
  console.log(
    `Thought ${_id?.substring(
      0,
      8
    )}: userId=${userId}, currentUser=${currentUserId}, ` +
      `can edit=${canEdit}, isOwn=${isOwn}`
  )
  console.log(`Thought ${_id?.substring(0, 8)}: tags=`, tags)

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

  // Log some debug info to help diagnose
  console.log('Thought tags:', {
    thoughtId: _id?.substring(0, 8),
    providedTags: tags,
    extractedTags,
    willDisplay: tags?.length ? tags : extractedTags
  })

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

  // Add this debug code to help troubleshoot
  console.log('Rendering thought with tags:', {
    id: _id?.substring(0, 8),
    tags,
    tagsType: typeof tags,
    isArray: Array.isArray(tags)
  })

  return (
    <ThoughtContainer $isNew={isNew}>
      <TopSection>
        <TagList tags={tags?.length ? tags : extractedTags} />
        <TimeStamp>{formattedDate}</TimeStamp>
      </TopSection>

      <MessageSection>{displayMessageFinal}</MessageSection>

      <BottomSection>
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
    </ThoughtContainer>
  )
}
