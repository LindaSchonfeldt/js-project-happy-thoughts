import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App.jsx'
import { ThoughtsProvider } from './contexts/ThoughtsContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThoughtsProvider>
      <App />
    </ThoughtsProvider>
  </React.StrictMode>
)
