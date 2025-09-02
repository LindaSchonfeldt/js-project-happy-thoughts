/**
 * GlobalStyles Component
 * Purpose: Provides global CSS styles for the Happy Thoughts app.
 * Usage: Imported and used in App.jsx.
 * Author: Linda Schonfeldt
 * Last Updated: September 2, 2025
 */
import { createGlobalStyle } from 'styled-components'

export const GlobalStyles = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
  }

  :root {
    --color-primary: #ffadad;
    --color-secondary: #ff6b6b;
    --color-tertiary: #ff3d3d;
    --color-background: #f2f0f0;
    --color-text: #333;
    --color-border: #ccc;
  }
  
  body {
      font-family: 'Roboto Mono', Arial, Helvetica, sans-serif;
      font-weight: 500;
      color: var(--color-text);
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: Helvetica, Arial, sans-serif;
    font-weight: 500;
  }
`
