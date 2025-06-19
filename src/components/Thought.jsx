import React, { useState } from 'react'
import styled, { keyframes } from 'styled-components'

import { useLikeSystem } from '../hooks/useLikeSystem'
import { useThoughtAuthorization } from '../hooks/useThoughtAuthorization'
import { media } from '../media'
import { formatDate } from '../utils/dateHelpers'
import { getThoughtWithEmoji, restoreEmoji } from '../utils/emojiUtils'
import { Button } from './Button'
import TagList from './TagList'

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
  const { getCurrentUserId, isOwnThought } = useThoughtAuthorization(userId)

  // Get current user ID to compare with thought owner
  const currentUserId = getCurrentUserId()

  // Merge both arrays
  const allTags = [...tags, ...themeTags]

  // Check if user owns this thought (can edit/delete)
  const canEdit = isOwn || (userId && currentUserId && userId === currentUserId)

  // Log for debugging
  console.log(
    `Thought ${_id?.substring(
      0,
      8
    )}: userId=${userId}, currentUser=${currentUserId}, isOwn=${canEdit}`
  )
  console.log(`Thought ${_id?.substring(0, 8)}: tags=`, tags)

  // Extract tags from message if none provided
  const extractedTags =
    tags && tags.length > 0 ? tags : message.match(/#[\w]+/g) || []

  console.log(`Thought ${_id?.substring(0, 8)}: extracted tags=`, extractedTags)

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
  const displayMessage =
    typeof message === 'object'
      ? message.message || 'No message content'
      : message

  return (
    <ThoughtContainer $isNew={isNew}>
      <TopSection>
        <TagList tags={allTags} />
        <TimeStamp>{formattedDate}</TimeStamp>
      </TopSection>

      <MessageSection>{displayMessage}</MessageSection>

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
