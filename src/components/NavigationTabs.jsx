import { Link, useLocation } from 'react-router-dom'
import styled from 'styled-components'

import { media } from '../utils/media'

const TabsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;

  ${media.tablet} {
    justify-content: center;
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }
`

const TabLink = styled(Link)`
  cursor: pointer;
  font-size: 14px;
  font-family: 'Roboto Mono', monospace;
  color: var(--color-primary);
  text-decoration: none;
  border-radius: 4px;
  transition: all 0.2s ease;
  text-align: center;
  width: 160px;

  &:hover {
    color: var(--color-secondary);
    transform: translateY(-2px);
  }

  &.active {
    color: var(--text-color);
    text-decoration: underline;
  }

  // Hide when empty
  &:empty {
    display: none;
  }

  ${media.tablet} {
  }
`

export const NavigationTabs = () => {
  const location = useLocation()

  return (
    <TabsContainer>
      <TabLink to='/' className={location.pathname === '/' ? 'active' : ''}>
        All Thoughts
      </TabLink>
      <TabLink
        to='/user-thoughts'
        className={location.pathname === '/user-thoughts' ? 'active' : ''}
      >
        Created Thoughts
      </TabLink>
      <TabLink
        to='/liked-thoughts'
        className={location.pathname === '/liked-thoughts' ? 'active' : ''}
      >
        Liked Thoughts
      </TabLink>
    </TabsContainer>
  )
}
