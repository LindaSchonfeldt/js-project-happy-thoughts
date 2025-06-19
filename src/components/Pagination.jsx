import React from 'react'
import styled from 'styled-components'

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 20px 0;
`

const PageButton = styled.button`
  font-family: 'Roboto Mono', monospace;
  font-size: 14px;
  padding: 5px 10px;
  border: 1px solid #ccc;
  background: ${(props) => (props.active ? '#f0f0f0' : 'white')};
  cursor: pointer;
`

export const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  console.log('Pagination props:', { currentPage, totalPages }) // Debug log

  if (!totalPages || totalPages <= 1) return null

  return (
    <PaginationContainer>
      <PageButton
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        Previous
      </PageButton>

      <span>
        Page {currentPage} of {totalPages}
      </span>

      <PageButton
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        Next
      </PageButton>
    </PaginationContainer>
  )
}
