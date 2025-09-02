/**
 * Button Component
 * Purpose: Reusable button for UI actions in Happy Thoughts app.
 * Usage: Used throughout the app for form submissions and actions.
 * Author: Linda Schonfeldt
 * Last Updated: September 2, 2025
 */
import React from 'react'
import styled from 'styled-components'

// Styled button component
export const StyledButton = styled.button`
  font-family: -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto,
    Ubuntu;
  background-color: #ffadad;
  color: black;
  border: none;
  padding: 4px;
  cursor: pointer;

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  /* Variant-specific styles */
  ${(props) =>
    props.$variant === 'icon' &&
    `
    padding: 10px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: ${props.$isLiked ? '#ffadad' : 'rgb(211, 211, 211)'};

    &:hover {
      background-color: #ff6b6b;
    }
    &:active {
      background-color: #ff3d3d;
    }
  `}

  ${(props) =>
    (props.$variant === 'text' || !props.$variant) &&
    `
    border-radius: 0px;
    padding: 10px 20px;
    margin-top: 10px;
    min-width: 120px;
    
    &:hover {
      background-color: var(--color-secondary);
    }
    &:active {
      background-color: var(--color-tertiary);
    }
  `}

    ${(props) =>
    (props.$variant === 'authed' || !props.$variant) &&
    `
    min-width: 20px;
    background-color: transparent;
    border: solid 1px black;
    
    &:hover {
      background-color: var(--color-secondary);
    }
    &:active {
      background-color: var(--color-tertiary);
    }
  `}

      ${(props) =>
    (props.$variant === 'danger' || !props.$variant) &&
    `
    min-width: 20px;
    background-color: var(--color-secondary);    
    border: solid 1px black;
    
    &:hover {
      background-color: var(--color-tertiary);
    }
  `}

  ${(props) =>
    (props.$variant === 'login' || !props.$variant) &&
    `
    padding: 8px 16px;
    color: var(--color-text);
    background-color: var(--color-primary);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    display: flex;
    font-size: 12px;
    font-weight: 500;
    font-family: 'Roboto Mono', monospace;
    white-space: nowrap;   
    
    &:hover {
      background-color: var(--color-secondary);
    }

`}

  // Add more visible active state for liked buttons
  ${(props) =>
    props.$isLiked &&
    `
    background-color: var(--color-primary);
    transform: scale(1.1);
  `}
`
export const Button = ({
  text,
  icon,
  type = 'button',
  onClick,
  disabled,
  isLiked,
  variant = 'text'
}) => (
  <StyledButton
    type={type}
    disabled={disabled}
    onClick={disabled ? undefined : onClick}
    $isLiked={isLiked}
    $variant={variant}
  >
    {variant === 'icon' ? icon : text}
  </StyledButton>
)
