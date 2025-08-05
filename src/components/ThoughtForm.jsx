import { useState } from 'react'
import styled from 'styled-components'

import { sanitizeInput } from '../utils/inputUtils.js'
import { media } from '../utils/media.js'
import { Button } from './Button'

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

  ${media.tablet} {
    padding: 24px 16px;
    width: 400px;
  }
  ${media.desktop} {
    padding: 32px 24px;
    width: 500px;
  }
`

const StyledHeading = styled.h2`
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  font-family: 'Roboto Mono', monospace;
  font-size: 14px;
  margin-top: 0;
  color: #333;
  font-weight: 600;
  margin-bottom: 8px;

  ${media.tablet} {
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

export default function ThoughtForm({ onSubmit }) {
  const [message, setMessage] = useState('')
  const [charCount, setCharCount] = useState(0) // Add this line if missing
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  sanitizeInput(message) // Sanitize input to prevent XSS attacks

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (isSubmitting) return

    setIsSubmitting(true)
    setError('')

    if (message.trim().length < 5) {
      setError('Your thought needs to be at least 5 characters long')
      setIsSubmitting(false)
      return
    }

    if (message.trim().length > 140) {
      setError('Your thought cannot exceed 140 characters')
      setIsSubmitting(false)
      return
    }

    try {
      console.log('Submitting form with message:', message)
      const result = await onSubmit(message)

      console.log('Form submission result:', result)

      if (result && result.success) {
        setMessage('')
        setCharCount(0) // This line was causing the error
        setError('')
      } else {
        setError(result?.message || 'Failed to post your thought')
      }
    } catch (err) {
      console.error('Form submission error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMessage = (e) => {
    const inputValue = e.target.value
    setMessage(inputValue)
    setCharCount(inputValue.length)
  }

  return (
    <StyledThoughtForm>
      <StyledHeading>What's making you happy right now?</StyledHeading>
      <StyledForm onSubmit={handleSubmit}>
        <StyledInput
          type='text'
          placeholder='Type your happy thought here...'
          value={message}
          onChange={handleMessage}
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
          text='Send Happy Thought ❤️'
          type='submit'
          disabled={
            isSubmitting || message.trim().length === 0 || message.length > 140
          }
        >
          {isSubmitting ? 'Posting...' : 'Send Happy Thought ❤️'}
        </Button>
        {error && <StyledError>{error}</StyledError>}
      </StyledForm>
    </StyledThoughtForm>
  )
}
