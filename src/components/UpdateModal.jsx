import { useState, useEffect } from 'react'
import styled from 'styled-components'

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`

const Modal = styled.div`
  background: white;
  border-radius: 0px;
  padding: 20px;
  width: 90%;
  max-width: 500px;

  h2 {
    margin-top: 0;
    margin-bottom: 8px;
    font-family: 'Roboto Mono', Arial, Helvetica, sans-serif;
    font-size: 18px;
    color: var(--color-text);
  }
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const Textarea = styled.textarea`
  padding: 12px 4px;
  border: 1px solid #ddd;
  border-radius: 4px;
  height: 100px;
  font-family: inherit;
`

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 0px;
  cursor: pointer;

  ${(props) =>
    props.primary &&
    `
    background: var(--color-secondary);
    color: var(--color-text);
    border: none;
  `}

  ${(props) =>
    props.secondary &&
    `
    background: transparent;
    border: 1px solid #ddd;
  `}
`

export const UpdateModal = ({ isOpen, onClose, initialMessage, onSave }) => {
  const [message, setMessage] = useState(initialMessage || '')

  useEffect(() => {
    if (initialMessage !== undefined) {
      setMessage(initialMessage)
    }
  }, [initialMessage])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (message && message.trim()) {
      onSave(message)
    }
  }

  return (
    <Overlay>
      <Modal>
        <h2>Update your thought</h2>
        <Form onSubmit={handleSubmit}>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder='Type your updated thought here...'
            autoFocus
          />
          <ButtonRow>
            <Button type='button' secondary onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' primary>
              Save
            </Button>
          </ButtonRow>
        </Form>
      </Modal>
    </Overlay>
  )
}
