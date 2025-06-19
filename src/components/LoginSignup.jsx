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

const SignUp = ({ setToken }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (errors[name]) {
      setErrors({ ...errors, [name]: null })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})

    try {
      const result = await api.signupUser(formData)

      if (result.success && result.token) {
        localStorage.setItem('token', result.token)
        setToken(result.token)
      } else if (result.errors) {
        setErrors(result.errors)
      } else {
        setErrors({ general: 'Signup failed' })
      }
    } catch (err) {
      const resp = err.response?.data
      if (resp?.errors) {
        setErrors(resp.errors)
      } else {
        setErrors({ general: resp?.message || err.message || 'Signup failed' })
      }
    }
  }

  const { username, email, password } = formData

  return (
    <StyledForm onSubmit={handleSubmit}>
      {errors.general && <ErrorMessage>{errors.general}</ErrorMessage>}

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
        name='email'
        type='email'
        placeholder='Email'
        value={email}
        onChange={handleChange}
        required
      />
      {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}

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
      {isLogin ? <Login setToken={setToken} /> : <SignUp setToken={setToken} />}

      <ToggleText onClick={() => setIsLogin(!isLogin)}>
        {isLogin
          ? 'Need an account? Sign up'
          : 'Already have an account? Login'}
      </ToggleText>
    </StyledLoginSignup>
  )
}
