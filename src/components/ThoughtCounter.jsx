/**
 * ThoughtCounter Component
 * Purpose: Displays the total number of thoughts.
 * Usage: Used in dashboard and summary views.
 * Author: Linda Schonfeldt
 * Last Updated: September 2, 2025
 */
import styled from 'styled-components'

const ThoughtCounterContainer = styled.div`
  text-align: center;
  color: #666;
  margin-bottom: 20px;

  @media (max-width: 600px) {
    font-size: 12px;
    margin: 12px 0;
  }
`
export const ThoughtCounter = ({
  filteredThoughts,
  currentPage,
  totalPages
}) => {
  // Debug mode
  return (
    <ThoughtCounterContainer>
      <div>
        Showing {filteredThoughts.length} thoughts on page {currentPage} of{' '}
        {totalPages}
      </div>
    </ThoughtCounterContainer>
  )
}
