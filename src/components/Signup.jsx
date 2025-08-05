// Adjust the import based on your file structure
import React, { useState } from 'react'
import styled from 'styled-components'

import * as api from '../api/api'
import { Button } from './Button'

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

const ErrorMessage = styled.p`
  color: red;
  font-size: 12px;
  margin: 5px 0;
  text-align: center;
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

export const SignUp = ({ onClose, onSignupSuccess, setIsLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        setErrors({ confirmPassword: 'Passwords do not match' })
        return
      }

      // Validate password length
      if (formData.password.length < 6) {
        setErrors({ password: 'Password must be at least 6 characters' })
        return
      }

      // Call signup API
      const result = await api.signupUser({
        username: formData.username,
        password: formData.password
      })

      if (result.success) {
        console.log('Signup successful:', result)

        // Call success callback
        if (onSignupSuccess) {
          await onSignupSuccess({
            token: result.token,
            user: result.user
          })
        }
        onClose()
      } else {
        setErrors({ general: result.message || 'Signup failed' })
      }
    } catch (err) {
      console.error('Signup error:', err)

      if (err.message?.includes('Username already exists')) {
        setErrors({
          username: 'Username already exists. Try logging in instead.'
        })
      } else {
        setErrors({
          general: err.message || 'Signup failed. Please try again.'
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Title>Create Account</Title>
      <StyledForm onSubmit={handleSubmit}>
        <input
          type='text'
          placeholder='Username'
          value={formData.username}
          onChange={(e) =>
            setFormData({ ...formData, username: e.target.value })
          }
          required
        />
        {errors.username && <ErrorMessage>{errors.username}</ErrorMessage>}

        <input
          type='password'
          placeholder='Password (min 6 characters)'
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          required
        />
        {errors.password && <ErrorMessage>{errors.password}</ErrorMessage>}

        <input
          type='password'
          placeholder='Confirm Password'
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData({ ...formData, confirmPassword: e.target.value })
          }
          required
        />
        {errors.confirmPassword && (
          <ErrorMessage>{errors.confirmPassword}</ErrorMessage>
        )}

        <Button
          type='submit'
          variant='login'
          disabled={loading}
          text={loading ? 'Creating Account...' : 'Sign Up'}
        />

        {errors.general && <ErrorMessage>{errors.general}</ErrorMessage>}
      </StyledForm>

      <ToggleText onClick={() => setIsLogin(true)}>
        Already have an account? Login
      </ToggleText>
    </div>
  )
}
