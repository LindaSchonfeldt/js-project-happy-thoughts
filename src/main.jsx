/**
 * Main Entry Point
 * Purpose: Renders the App component into the DOM.
 * Usage: Entry file for Vite/React frontend.
 * Author: Linda Schonfeldt
 * Last Updated: September 2, 2025
 */
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
