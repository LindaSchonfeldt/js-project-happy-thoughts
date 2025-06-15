import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { useEffect, useState } from 'react'
import styled from 'styled-components'

export const StyledLoader = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: ${(props) => (props.$fullScreen ? 'fixed' : 'relative')};
  top: 0;
  left: 0;
  height: ${(props) => (props.$fullScreen ? '100vh' : '200px')};
  width: ${(props) => (props.$fullScreen ? '100vw' : 'auto')};
  background-color: ${(props) =>
    props.$transparent ? 'transparent' : 'var(--color-background)'};
  padding: ${(props) => props.$padding || '0'};
  z-index: 1000; /* Ensure the loader is above other content */
`

const LoaderMessage = styled.p`
  text-align: center;
  margin-top: 8px;
  font-family: 'Roboto Mono', sans-serif;
  font-size: ${(props) => props.$fontSize || '16px'};
  color: ${(props) => props.$textColor || '#555'};
`

export const Loader = ({
  // Animation options
  src = 'https://lottie.host/c109aa21-ec91-47e1-a1c5-60d07f9de45a/7g1tvlHHDZ.lottie',
  size = 200,

  // Container options
  fullScreen = true,
  fullWidth = false,
  transparent = false,
  padding = '0',

  // Message options
  message = '',
  showTimedMessage = false,
  loadingTime = 3000,
  timedMessage = 'This is taking longer than expected...',
  textColor = '#555',
  fontSize = '16px'
}) => {
  const [showMessage, setShowMessage] = useState(false)

  // Show a delayed message if loading takes too long
  useEffect(() => {
    let timer

    if (showTimedMessage) {
      timer = setTimeout(() => {
        setShowMessage(true)
      }, loadingTime)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [showTimedMessage, loadingTime])

  return (
    <StyledLoader
      $fullScreen={fullScreen}
      $fullWidth={fullWidth}
      $transparent={transparent}
      $padding={padding}
    >
      <DotLottieReact
        src={src}
        loop
        autoplay
        style={{ width: `${size}px`, height: `${size}px` }}
      />

      {message && (
        <LoaderMessage $textColor={textColor} $fontSize={fontSize}>
          {message}
        </LoaderMessage>
      )}

      {showTimedMessage && showMessage && (
        <LoaderMessage $textColor={textColor} $fontSize={fontSize}>
          {timedMessage}
        </LoaderMessage>
      )}
    </StyledLoader>
  )
}

export const LoadingScreen = ({ message = 'Loading your thoughts...' }) => {
  return (
    <Loader
      $fullScreen={true}
      $transparent={false}
      $padding='0'
      message={message}
    />
  )
}
