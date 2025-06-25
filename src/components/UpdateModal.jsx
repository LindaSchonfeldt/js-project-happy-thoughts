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
`

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
`

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  resize: none;
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

export const UpdateModal = ({ isOpen, onClose, initialMessage, onSave }) => {
  const [message, setMessage] = useState(initialMessage || '')

  // Update local state when prop changes
  useEffect(() => {
    setMessage(initialMessage || '')
  }, [initialMessage])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()

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
        message: message,
        tags: extractedTags.length > 0 ? extractedTags : ['general'],
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
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What's on your mind?"
            rows={4}
            required
          />

          <ButtonContainer>
            <CancelButton type='button' onClick={onClose}>
              Cancel
            </CancelButton>
            <SaveButton type='submit'>Save</SaveButton>
          </ButtonContainer>
        </form>
      </ModalContent>
    </ModalOverlay>
  )
}
