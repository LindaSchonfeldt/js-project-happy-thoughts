import React, { useState } from 'react'
import styled from 'styled-components'

import * as api from '../api/api'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './Button'
import { SignUp } from './Signup'

const StyledLogin = styled.div`
  width: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
`

const StyledForm = styled.form`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 500px;

  input {
    width: 100%;
    padding: 5px;
    border: 2px solid #ccc;
    box-sizing: border-box;
    font-size: 14px;
    font-family: 'Roboto Mono', monospace;
    color: var(--color-text);
    text-align: left;

    &:focus {
      outline: none;
      border-color: var(--color-primary);
    }
  }
`

const ToggleText = styled.p`
  font-size: 14px;
  color: #666;
  cursor: pointer;
  text-decoration: underline;
  margin: 0;

  &:hover {
    color: var(--color-primary);
  }
`

const ErrorMessage = styled.p`
  color: red;
  font-size: 12px;
  margin: -5px 0 5px 0;
  text-align: left;
  width: 100%;
`

export const Login = ({ onClose, onLoginSuccess }) => {
  const { login: contextLogin } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await api.login(username, password)

      if (result.success) {
        console.log('Login API success:', result)

        // Use context login AND callback
        await contextLogin(result.user, result.token)

        // Also call the callback if provided
        if (onLoginSuccess) {
          await onLoginSuccess({
            token: result.token,
            user: result.user
          })
        }

        // Close the modal
        onClose()
      } else {
        setError(result.message || 'Login failed')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <StyledLogin>
      {isLogin ? (
        <StyledForm onSubmit={handleLoginSubmit}>
          <input
            name='username'
            type='text'
            placeholder='Username'
            value={username}
            onChange={(e) => setUserName(e.target.value)}
            required
          />
          <input
            name='password'
            type='password'
            placeholder='Password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button
            type='submit' // ← HTML type for form submission
            variant='login' // ← Visual variant for styling
            disabled={loading}
            text={loading ? 'Logging in...' : 'Login'}
          />
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </StyledForm>
      ) : (
        <SignUp
          onClose={onClose}
          onSignupSuccess={onLoginSuccess}
          setIsLogin={setIsLogin}
        />
      )}

      <ToggleText onClick={() => setIsLogin(!isLogin)}>
        {isLogin
          ? 'Need an account? Sign up'
          : 'Already have an account? Login'}
      </ToggleText>
    </StyledLogin>
  )
}
