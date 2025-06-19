import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { Button } from './Button'
import { LogoutButton } from './LogoutButton'

const NavContainer = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 20px;
  }
`

const Logo = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  font-family: 'Roboto Mono', monospace;
  cursor: pointer;
`

const NavActions = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`

const WelcomeText = styled.span`
  margin-right: 10px;
`

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`

const NavLink = styled(Link)`
  cursor: pointer;
  font-size: 1rem;
  font-family: 'Roboto Mono', monospace;
  &:hover {
    text-decoration: underline;
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
      <Logo onClick={() => navigate('/')}>Happy Thoughts</Logo>

      <NavLinks>
        {isLoggedIn && (
          <>
            <NavLink to='/'>All Thoughts</NavLink>
            <NavLink to='/user-thoughts'>My Thoughts</NavLink>
            <NavLink to='/liked-thoughts'>Liked Thoughts</NavLink>
          </>
        )}
      </NavLinks>

      <NavActions>
        {isLoggedIn ? (
          <>
            <WelcomeText>Welcome {username}</WelcomeText>
            <LogoutButton onLogout={handleLogout} />
          </>
        ) : (
          <Button variant='login' text='Login' onClick={handleLogin} />
        )}
      </NavActions>
    </NavContainer>
  )
}
