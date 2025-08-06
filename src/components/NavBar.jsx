import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { media } from '../utils/media.js'
import { Button } from './Button'

const NavContainer = styled.nav`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  margin-bottom: 20px;
  padding: 0 20px;

  ${media.tablet} {
    flex-direction: row;
    height: 60px;
  }
`

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  ${media.tablet} {
    flex: 1; // ✅ CHANGED: Let it grow
    justify-content: flex-start; // ✅ ADDED: Align left
  }
`

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;

  ${media.tablet} {
    flex: 1; // ✅ CHANGED: Let it grow
    justify-content: flex-end; // ✅ ADDED: Align right
  }
`

const LoginSection = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;

  ${media.tablet} {
    flex: 1; // ✅ CHANGED: Let it grow
    justify-content: flex-end; // ✅ Push login to the right
  }
`

const Logo = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  font-family: 'Roboto Mono', monospace;
  cursor: pointer;
`

const WelcomeText = styled.span`
  font-size: 0.9rem;
  color: var(--color-text);

  ${media.mobile} {
    display: none;
  }
`

export const NavBar = ({ token, showLogin, setShowLogin, handleLogout }) => {
  const navigate = useNavigate()

  // Fix token retrieval - don't parse as JSON
  const getToken = () => {
    try {
      return localStorage.getItem('token')
    } catch (error) {
      console.error('Error getting token:', error)
      return null
    }
  }

  const isLoggedIn = !!getToken()

  // Get username from decoded token or user info
  const getUsername = () => {
    try {
      // Try to get username from userInfo if stored separately
      const userInfo = localStorage.getItem('userInfo')
      if (userInfo) {
        const parsed = JSON.parse(userInfo)
        if (parsed.username) return parsed.username
      }

      // Default username if we can't find one
      return 'User'
    } catch (error) {
      return 'User'
    }
  }

  const username = getUsername()

  const handleLogin = () => {
    setShowLogin(true)
  }

  return (
    <NavContainer>
      {/* LEFT: Just the logo */}
      <LeftSection>
        <Logo onClick={() => navigate('/')}>Happy Thoughts</Logo>
      </LeftSection>

      {/* RIGHT: Login button OR user info */}
      {!isLoggedIn ? (
        <LoginSection>
          <Button variant='login' text='Login' onClick={handleLogin} />
        </LoginSection>
      ) : (
        <RightSection>
          <WelcomeText>Welcome {username}</WelcomeText>
          <Button variant='login' text='Logout' onClick={handleLogout} />
        </RightSection>
      )}
    </NavContainer>
  )
}
