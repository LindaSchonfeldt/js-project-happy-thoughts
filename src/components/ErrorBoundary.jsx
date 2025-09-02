/**
 * ErrorBoundary Component
 * Purpose: Catches and displays errors in the React component tree.
 * Usage: Wraps components to provide error handling UI.
 * Author: Linda Schonfeldt
 * Last Updated: September 2, 2025
 */
import React from 'react'
import styled from 'styled-components'

const ErrorContainer = styled.div`
  padding: 20px;
  margin: 20px;
  border: 1px solid #f5c6cb;
  border-radius: 5px;
  background-color: #f8d7da;
  color: #721c24;
  text-align: center;
`

const ErrorHeading = styled.h2`
  color: #721c24;
`

const ErrorDetails = styled.details`
  margin-top: 15px;
  text-align: left;
  white-space: pre-wrap;
  background: #f1f1f1;
  padding: 10px;
  border-radius: 4px;
`

const ReloadButton = styled.button`
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 10px 15px;
  margin-top: 15px;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #c82333;
  }
`

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo)
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <ErrorContainer>
          <ErrorHeading>Something went wrong</ErrorHeading>
          <p>The application encountered an unexpected error.</p>
          {this.state.error && (
            <ErrorDetails>
              <summary>Error Details</summary>
              <p>{this.state.error.toString()}</p>
              <p>Component Stack: {this.state.errorInfo?.componentStack}</p>
            </ErrorDetails>
          )}
          <ReloadButton onClick={() => window.location.reload()}>
            Reload Page
          </ReloadButton>
        </ErrorContainer>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
