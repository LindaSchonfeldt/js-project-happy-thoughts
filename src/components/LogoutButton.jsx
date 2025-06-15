import styled from 'styled-components'

const StyledLogoutButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 8px 16px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-family: 'Roboto Mono', monospace;

  &:hover {
    background-color: #d32f2f;
  }

  &:active {
    transform: scale(0.98);
  }
`

export const LogoutButton = ({ onLogout }) => {
  return <StyledLogoutButton onClick={onLogout}>Logout</StyledLogoutButton>
}
