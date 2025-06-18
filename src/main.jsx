import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App.jsx'
import { ThoughtsProvider } from './contexts/ThoughtsContext'
import ErrorBoundary from './components/ErrorBoundary'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThoughtsProvider>
        <App />
      </ThoughtsProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
