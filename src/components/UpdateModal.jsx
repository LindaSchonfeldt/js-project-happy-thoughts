/**
 * UpdateModal Component
 * Purpose: Modal dialog for editing/updating a thought.
 * Usage: Used in ThoughtsList and user profile views.
 * Author: Linda Schonfeldt
 * Last Updated: September 2, 2025
 */
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`

const ModalContent = styled.div`
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
`

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-family: inherit;
  font-size: 18px;
`

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
`

const TextArea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 12px;
  border: 2px solid
    ${(props) =>
      props.$value.length > MAX_CHARS
        ? 'red'
        : props.$value.length > MAX_CHARS - 20
        ? 'orange'
        : props.$value.trim().length < MIN_CHARS &&
          props.$value.trim().length > 0
        ? '#f0ad4e'
        : '#ccc'};
  border-radius: 8px;
  font-family: inherit;
  font-size: 16px;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${(props) =>
      props.value.length > MAX_CHARS
        ? 'red'
        : props.value.length > MAX_CHARS - 20
        ? 'orange'
        : '#4a90e2'};
  }
`

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`

const CancelButton = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-text, black);
  cursor: pointer;

  &:hover {
    border: 1px solid var(--color-secondary, #d32f2f);
  }
`

const SaveButton = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  background: var(--color-secondary);
  color: black;
  cursor: pointer;

  &:hover {
    background: var(--color-secondary-hover, #d32f2f);
  }
`

const CharacterCounter = styled.div`
  text-align: right;
  margin-top: 4px;
  font-size: 12px;
  color: ${(props) => {
    if (props.$isError) return '#e74c3c' // Red for error
    if (props.$isWarning) return '#e67e22' // Orange for warning
    if (props.$isTooShort) return '#f39c12' // Yellow for too short
    return '#777' // Normal color
  }};
  font-weight: ${(props) => (props.$isInvalid ? '600' : '400')};
`

const ErrorMessage = styled.div`
  color: #e74c3c;
  font-size: 14px;
  margin: 8px 0;
  padding: 4px 0;
  font-weight: 500;
`

// Constants for validation
const MIN_CHARS = 5
const MAX_CHARS = 140

export const UpdateModal = ({
  isOpen,
  onClose,
  initialMessage,
  onSave,
  thought
}) => {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [charCount, setCharCount] = useState(0)

  // Fix: Run effect regardless of isOpen state, but add console logs
  useEffect(() => {
    console.log('UpdateModal useEffect triggered:', { isOpen, thought })

    if (isOpen && thought?.message) {
      console.log('Setting message to:', thought.message)
      setMessage(thought.message)
      setCharCount(thought.message.length)
      setError('')
    }
  }, [thought, isOpen])

  // Then handle visibility with the return statement
  if (!isOpen) return null

  const handleMessageChange = (e) => {
    const newMessage = e.target.value
    setMessage(newMessage)
    setCharCount(newMessage.length)

    // Real-time validation
    if (newMessage.trim().length > 0 && newMessage.trim().length < MIN_CHARS) {
      setError(`Thought must be at least ${MIN_CHARS} characters`)
    } else if (newMessage.length > MAX_CHARS) {
      setError(`Thought cannot exceed ${MAX_CHARS} characters`)
    } else {
      setError('') // Clear error when valid
    }
  }

  const validateMessage = () => {
    if (message.trim().length < MIN_CHARS) {
      setError(`Thought must be at least ${MIN_CHARS} characters`)
      return false
    }

    if (message.length > MAX_CHARS) {
      setError(`Thought cannot exceed ${MAX_CHARS} characters`)
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate before submitting
    if (message.trim().length < MIN_CHARS) {
      setError(`Thought must be at least ${MIN_CHARS} characters`)
      return
    }

    if (message.length > MAX_CHARS) {
      setError(`Thought cannot exceed ${MAX_CHARS} characters`)
      return
    }

    try {
      // Extract hashtags from message
      const extractHashtags = (text) => {
        const hashtagRegex = /#(\w+)/g
        const matches = text.match(hashtagRegex) || []
        return matches.map((tag) => tag.substring(1).toLowerCase())
      }

      // Get extracted tags from message
      const extractedTags = extractHashtags(message)

      // Create the update data - ALWAYS include the tags array with a default
      const updateData = {
        message: message.trim(),
        tags: thought?.tags || [],
        // Always set preserveTags to true
        preserveTags: true
      }

      console.log('Submitting update with data:', updateData)

      try {
        // Call the onSave function and store the result
        const result = await onSave(updateData)

        // Defensive programming - make sure result exists
        if (result && result.success) {
          onClose() // Close the modal on success
        } else {
          // Handle case where result exists but success is false
          console.warn('Update returned unsuccessful result:', result)
          // Still close the modal - UI will be updated optimistically
          onClose()
        }
      } catch (error) {
        console.error('Error updating thought:', error)
        // Show error message to user but still close modal since UI is updated optimistically
        onClose()
      }
    } catch (error) {
      console.error('Error in form submission:', error)
      onClose()
    }
  }

  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          <h2>Update Thought</h2>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <TextArea
            $value={message}
            value={message}
            onChange={handleMessageChange}
            placeholder="What's on your mind?"
            rows={4}
            required
          />

          {/* Character counter - changes color when approaching limit */}
          <CharacterCounter
            $count={message.length}
            $isError={message.length > MAX_CHARS}
            $isWarning={
              message.length > MAX_CHARS - 20 && message.length <= MAX_CHARS
            }
            $isTooShort={
              message.trim().length > 0 && message.trim().length < MIN_CHARS
            }
            $isInvalid={
              message.length > MAX_CHARS ||
              (message.trim().length < MIN_CHARS && message.trim().length > 0)
            }
          >
            {message.length}/{MAX_CHARS}
            {message.trim().length > 0 &&
              message.trim().length < MIN_CHARS &&
              ' (too short)'}
          </CharacterCounter>

          {/* Display validation error */}
          {error && <ErrorMessage>{error}</ErrorMessage>}

          <ButtonContainer>
            <CancelButton type='button' onClick={onClose}>
              Cancel
            </CancelButton>
            <SaveButton
              type='submit'
              disabled={
                !message.trim() ||
                message.trim().length < MIN_CHARS ||
                message.length > MAX_CHARS
              }
            >
              Save
            </SaveButton>
          </ButtonContainer>
        </form>
      </ModalContent>
    </ModalOverlay>
  )
}
