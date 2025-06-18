import styled from 'styled-components'

const StatusContainer = styled.div`
  background-color: ${(props) => (props.$isError ? '#ffecec' : '#f0f0f0')};
  border: 1px solid ${(props) => (props.$isError ? '#ffb8b8' : '#ddd')};
  padding: 15px;
  margin: 20px auto;
  max-width: 500px;
  border-radius: 8px;
  text-align: center;
`

const StatusTitle = styled.h3`
  margin-top: 0;
  color: ${(props) => (props.$isError ? '#d8000c' : '#666')};
`

const RetryButton = styled.button`
  background-color: #4285f4;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  margin-top: 10px;
  cursor: pointer;

  &:hover {
    background-color: #3367d6;
  }
`

export const ServiceStatus = ({ error, isLoading, onRetry }) => {
  if (!error && !isLoading) return null

  let message = ''
  let isError = false

  if (isLoading) {
    message = 'Connecting to server...'
  } else if (error) {
    isError = true
    if (error.includes('CORS')) {
      message = 'Cross-origin error: The API server may be down or restricted.'
    } else if (error.includes('503')) {
      message = 'The server is currently unavailable. This may be temporary.'
    } else if (error.includes('Failed to fetch liked thoughts')) {
      message =
        'Unable to retrieve liked thoughts. This feature may not be available yet.'
    } else {
      message = error
    }
  }

  return (
    <StatusContainer $isError={isError}>
      <StatusTitle $isError={isError}>
        {isLoading ? 'Connecting...' : 'Connection Issue'}
      </StatusTitle>
      <p>{message}</p>
      {isError && <RetryButton onClick={onRetry}>Try Again</RetryButton>}
    </StatusContainer>
  )
}
