import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { ThoughtsProvider } from './contexts/ThoughtsContext'
import { UserProvider } from './contexts/UserContext'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <UserProvider>
      <ThoughtsProvider>
        <App />
      </ThoughtsProvider>
    </UserProvider>
  </React.StrictMode>
)
