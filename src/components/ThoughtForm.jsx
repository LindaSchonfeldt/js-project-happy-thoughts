import { useState } from 'react'
import { Button } from './Button'
import styled from 'styled-components'
import { media } from '../media'

export const StyledThoughtForm = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding: 12px 8px;
  width: 300px;
  background-color: var(--color-background);
  border: 2px solid black;
  box-shadow: 6px 6px 0 0 black;
  margin: 2rem auto;

  @media ${media.tablet} {
    padding: 24px 16px;
    width: 400px;
  }
  @media ${media.desktop} {
    padding: 32px 24px;
    width: 500px;
  }
`

const StyledHeading = styled.h2`
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  font-size: 12px;
  margin-top: 0;
  color: #333;
  font-weight: 600;
  margin-bottom: 8px;

  @media ${media.tablet} {
    font-size: 14px;
    margin-bottom: 16px;
  }
  @media ${media.desktop} {
    font-size: 16px;
    margin-bottom: 16px;
  }
`

const StyledForm = styled.form`
  width: 100%;
`
const StyledInput = styled.textarea`
  width: 100%;
  height: 60px;
  padding: 8px;
  border: 2px solid #ccc;
  font-size: 12px;
  resize: none;
  font-family: inherit;
  display: block;
  line-height: 1.2;
  vertical-align: top;

  &::placeholder {
    /* Remove the absolute positioning */
    position: static;
    color: #999;
    font-size: 12px;
  }

  @media ${media.tablet} {
    font-size: 14px;
    height: 80px;
  }
  @media ${media.desktop} {
    font-size: 16px;
    height: 100px;
  }
`
const StyledFooter = styled.div`
  color: ${(props) => (props.$remaining < 0 ? 'red' : '#333')};
  font-size: 12px;
  margin-top: 4px;
`

const StyledError = styled.div`
  color: red;
  font-size: 12px;
  margin-top: 8px;
`

// Form component to accept thoughts from the user
// with usePostThought (hook) that handles the actual posting logic

export const ThoughtForm = ({ onSubmit }) => {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Clear any previous errors
    setError('')

    // Get the message from the state or form
    const messageToSubmit = message.trim()

    // Validate the message
    if (!messageToSubmit || messageToSubmit.length === 0) {
      setError('Please enter a message')
      return
    }

    if (messageToSubmit.length < 5) {
      setError('Message must be at least 5 characters')
      return
    }

    if (messageToSubmit.length > 140) {
      setError('Message must be 140 characters or less')
      return
    }

    try {
      setIsSubmitting(true)

      // Call the onSubmit prop with the message string
      await onSubmit(messageToSubmit)

      // Clear the form on success
      setMessage('')
    } catch (err) {
      setError('Failed to post thought. Please try again.')
      console.error('Form submission error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e) => {
    setMessage(e.target.value)
    // Clear error when user starts typing
    if (error) setError('')
  }

  return (
    <StyledThoughtForm>
      <StyledHeading>What's making you happy right now?</StyledHeading>
      <StyledForm onSubmit={handleSubmit}>
        <StyledInput
          type='text'
          placeholder='Type your happy thought here...'
          value={message}
          onChange={handleInputChange}
          disabled={isSubmitting}
        />
        <StyledFooter>
          <span
            className={`char-counter ${message.length > 140 ? 'error' : ''}`}
          >
            {message.length}/140
          </span>
        </StyledFooter>
        <Button
          text='❤️ Send Happy Thought ❤️'
          type='submit'
          disabled={
            isSubmitting || message.trim().length === 0 || message.length > 140
          }
        >
          {isSubmitting ? 'Posting...' : '❤️ Send Happy Thought'}
        </Button>
        {error && <StyledError>{error}</StyledError>}
      </StyledForm>
    </StyledThoughtForm>
  )
}
