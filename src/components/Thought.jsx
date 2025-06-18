import React, { useState } from 'react'
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
const TagsSection = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  margin-bottom: 8px;
  flex-wrap: wrap; /* Allow tags to wrap to next line */
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
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  width: 100%;
`

const BottomSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
`

const LikeCounterStyled = styled.div`
  display: flex;
  align-items: center;
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
  message,
  isNew,
  hearts: initialHearts,
  createdAt,
  tags,
  userId, // This is the thought creator's ID
  username,
  isAnonymous = true,
  onDelete,
  onUpdate,
  currentUserId
}) => {
  const { isLiked, likeCount, handleLike } = useLikeSystem(_id, initialHearts)
  const { canUpdateThought } = useThoughtAuthorization()

  // Reconstruct thought object for authorization check
  const thought = {
    _id,
    message,
    hearts: initialHearts,
    createdAt,
    tags,
    userId, // important for authorization check
    username
  }

  // Handle update action
  const handleUpdate = () => {
    if (onUpdate) {
      onUpdate(thought)
    }
  }

  // Handle delete action
  const handleDelete = () => {
    if (onDelete) {
      onDelete(_id)
    }
  }

  // Determine if user can edit/delete this thought
  const userCanUpdateThought = canUpdateThought
    ? canUpdateThought(thought)
    : false

  // Set flags for showing edit/delete buttons
  const showEditButton = userCanUpdateThought
  const showDeleteButton = userCanUpdateThought

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
        <TagsSection>
          {tags &&
            tags.length > 0 &&
            tags.map((tag, index) => <Tag key={index}>{tag}</Tag>)}
        </TagsSection>
        {/* Only show edit button if user owns the thought */}
        {showEditButton && (
          <Button variant='authed' text='Edit' onClick={handleUpdate} />
        )}
      </TopSection>

      <MessageSection>{displayMessage}</MessageSection>

      <BottomSection>
        <ActionRow>
          {/* Only show delete button if user owns the thought */}
          {showDeleteButton && (
            <Button
              variant='authed'
              text='Delete'
              onClick={handleDelete}
            />
          )}
          <LikeCounterStyled>
            <p>{`${displayLikeCount} x`}</p>
            <Button
              variant='icon'
              icon={'❤️'}
              onClick={handleLike}
              $isLiked={isLiked}
            />
          </LikeCounterStyled>
        </ActionRow>
      </BottomSection>

      <TimeStamp>{formattedDate}</TimeStamp>
    </ThoughtContainer>
  )
}
