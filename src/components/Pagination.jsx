import styled from 'styled-components'

const StyledPagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  gap: 10px;
`

const PageButton = styled.button`
  padding: 8px 12px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #e0e0e0;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

export const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const handlePrevious = () => {
    if (currentPage > 1) {
      console.log('Going to previous page:', currentPage - 1)
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      console.log('Going to next page:', currentPage + 1)
      onPageChange(currentPage + 1)
    }
  }

  return (
    <StyledPagination>
      <PageButton onClick={handlePrevious} disabled={currentPage === 1}>
        ◀
      </PageButton>
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <PageButton onClick={handleNext} disabled={currentPage === totalPages}>
        ▶
      </PageButton>
    </StyledPagination>
  )
}
