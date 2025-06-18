import styled from 'styled-components'

import { Button } from './Button'

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  margin: 2rem auto;
  max-width: 500px;
  text-align: center;
  border: 2px solid #ffadad;
  border-radius: 8px;
`

const ErrorTitle = styled.h3`
  color: #ff6b6b;
  margin-bottom: 1rem;
`

const ErrorMessage = styled.p`
  margin-bottom: 2rem;
`

export const ApiErrorFallback = ({
  error,
  resetErrorBoundary,
  retryAction
}) => {
  const handleRetry = () => {
    if (retryAction) {
      retryAction()
    }
    resetErrorBoundary()
  }

  return (
    <ErrorContainer>
      <ErrorTitle>Connection Problem</ErrorTitle>
      <ErrorMessage>
        We're having trouble connecting to the server. This might be due to:
        <ul>
          <li>Server maintenance</li>
          <li>Internet connection issues</li>
          <li>Temporary service disruption</li>
        </ul>
      </ErrorMessage>
      <Button variant='text' text='Try Again' onClick={handleRetry} />
    </ErrorContainer>
  )
}
