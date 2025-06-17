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
    border-radius: 16px;
    padding: 10px 20px;
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
