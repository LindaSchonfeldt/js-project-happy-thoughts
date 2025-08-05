import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { media } from '../utils/media.js'
import { Button } from './Button'
import { LogoutButton } from './LogoutButton'

const NavContainer = styled.nav`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 20px;
  padding: 0 20px;

  ${media.tablet} {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    height: 60px;
  }
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  ${media.tablet} {
    width: 100%;
  }
`

const Logo = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  font-family: 'Roboto Mono', monospace;
  cursor: pointer;
`

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  width: 100%;

  ${media.tablet} {
    width: auto;
  }

  // ✅ FIXED: Hide empty NavLinks when not logged in
  &:empty {
    display: none;
  }
`

const NavLink = styled(Link)`
  cursor: pointer;
  font-size: 1rem;
  font-family: 'Roboto Mono', monospace;

  &:hover {
    text-decoration: underline;
  }
`

const NavActions = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
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
      <Header>
        <Logo onClick={() => navigate('/')}>Happy Thoughts</Logo>

        {!isLoggedIn && (
          <div
            className='mobile-login'
            style={{
              display: 'block'
            }}
          >
            <Button variant='login' text='Login' onClick={handleLogin} />
          </div>
        )}
      </Header>

      {/* ✅ FIXED: Only show NavLinks when logged in */}
      {isLoggedIn && (
        <NavLinks>
          <NavLink to='/'>All Thoughts</NavLink>
          <NavLink to='/user-thoughts'>Created Thoughts</NavLink>
          <NavLink to='/liked-thoughts'>Liked Thoughts</NavLink>
        </NavLinks>
      )}

      {/* ✅ FIXED: Only show actions when logged in */}
      {isLoggedIn && (
        <NavActions>
          <WelcomeText>Welcome {username}</WelcomeText>
          <LogoutButton onLogout={handleLogout} />
        </NavActions>
      )}
    </NavContainer>
  )
}
