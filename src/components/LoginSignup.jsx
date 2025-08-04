import { useState } from 'react'
import styled from 'styled-components'

import { api } from '../api/api'
import { Button } from './Button'

const StyledLoginSignup = styled.div`
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
  margin: 5px 0;
  text-align: center;
`

const SwitchButton = styled.button`
  background: none;
  border: none;
  color: #2196f3;
  font-weight: 600;
  cursor: pointer;
  padding: 5px 0;
  margin-top: 5px;
  text-decoration: underline;

  &:hover {
    color: #0d47a1;
  }
`

const Login = ({ setToken }) => {
  const [username, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      const result = await api.loginUser({ username, password })

      if (result.success && result.token) {
        localStorage.setItem('token', result.token)
        if (result.user) {
          localStorage.setItem('user', JSON.stringify(result.user))
        } else {
          localStorage.setItem('userInfo', JSON.stringify({ username }))
        }
        setToken(result.token)
      } else {
        setError('Login failed')
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed')
    }
  }

  return (
    <StyledForm onSubmit={handleSubmit}>
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
      <Button type='submit'>Login</Button>
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </StyledForm>
  )
}

const SignUp = ({ setToken, setIsLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null) // Add this line

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (errors[name]) {
      setErrors({ ...errors, [name]: null })
    }
  }

  const handleSignupResponse = (response) => {
    if (!response.success) {
      // Check if the error is about existing username
      if (response.message && response.message.includes('already exists')) {
        // Show specific error with login suggestion
        setError(`${response.message}. Try logging in instead.`)
        // Optionally, automatically switch to login form
        setIsLogin(true)
      } else {
        // Show regular error
        setError(response.message || 'Signup failed. Please try again.')
      }
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setError(null) // Clear previous errors

    try {
      const result = await api.signupUser(formData)

      if (!handleSignupResponse(result)) {
        return // Stop execution if there was an error
      }

      // Handle successful signup
      if (result.success && result.token) {
        localStorage.setItem('token', result.token)
        setToken(result.token)
      } else {
        setError('Signup successful but no token received')
      }
    } catch (err) {
      console.error('Signup error:', err)

      // Handle the API error response
      if (err.message && err.message.includes('Username already exists')) {
        setError('Username already exists. Try logging in instead.')
        setIsLogin(true) // Switch to login form
      } else {
        setError(err.message || 'Signup failed. Please try again.')
      }
    }
  }

  const { username, password } = formData

  return (
    <StyledForm onSubmit={handleSubmit}>
      {errors.general && <ErrorMessage>{errors.general}</ErrorMessage>}

      {/* Add the enhanced error message */}
      {error && (
        <ErrorMessage>
          {error}
          {error.includes('already exists') && (
            <SwitchButton onClick={() => setIsLogin(true)} type='button'>
              Switch to Login
            </SwitchButton>
          )}
        </ErrorMessage>
      )}

      <input
        name='username'
        type='text'
        placeholder='Username'
        value={username}
        onChange={handleChange}
        required
      />
      {errors.username && <ErrorMessage>{errors.username}</ErrorMessage>}

      <input
        name='password'
        type='password'
        placeholder='Password'
        value={password}
        onChange={handleChange}
        required
      />
      {errors.password && <ErrorMessage>{errors.password}</ErrorMessage>}

      <Button type='submit'>Sign Up</Button>
    </StyledForm>
  )
}

export const LoginSignup = ({ setToken }) => {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <StyledLoginSignup>
      {isLogin ? (
        <Login setToken={setToken} />
      ) : (
        <SignUp setToken={setToken} setIsLogin={setIsLogin} />
      )}

      <ToggleText onClick={() => setIsLogin(!isLogin)}>
        {isLogin
          ? 'Need an account? Sign up'
          : 'Already have an account? Login'}
      </ToggleText>
    </StyledLoginSignup>
  )
}
