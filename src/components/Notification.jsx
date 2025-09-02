/**
 * Notification Component
 * Purpose: Displays notifications and alerts to the user.
 * Usage: Used for error, success, and info messages.
 * Author: Linda Schonfeldt
 * Last Updated: September 2, 2025
 */
import React, { useEffect } from 'react'
import styled, { keyframes } from 'styled-components'

const fadeIn = keyframes`
  from { 
    opacity: 0;
    transform: translateY(-10px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
`

const fadeOut = keyframes`
  from { 
    opacity: 1;
    transform: translateY(0);
  }
  to { 
    opacity: 0;
    transform: translateY(-10px);
  }
`

const NotificationContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 16px;
  border-radius: 4px;
  animation: ${fadeIn} 0.3s ease-out, ${fadeOut} 0.3s ease-in forwards;
  animation-delay: 0s, ${(props) => props.$duration - 300}ms;
  z-index: 1000;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);

  background-color: ${(props) => {
    switch (props.$type) {
      case 'error':
        return '#ffecec'
      case 'success':
        return '#e6fffa'
      case 'warning':
        return '#fff9e6'
      default:
        return '#e6f7ff'
    }
  }};

  border-left: 4px solid
    ${(props) => {
      switch (props.$type) {
        case 'error':
          return '#ff6b6b'
        case 'success':
          return '#4caf50'
        case 'warning':
          return '#ff9800'
        default:
          return '#2196f3'
      }
    }};
`

const NotificationMessage = styled.p`
  margin: 0;
  color: #333;
  font-family: 'Roboto Mono', monospace;
  font-size: 14px;
`

export const Notification = ({
  type = 'info',
  message,
  duration = 3000,
  onClose
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <NotificationContainer $type={type} $duration={duration}>
      <NotificationMessage>{message}</NotificationMessage>
    </NotificationContainer>
  )
}
