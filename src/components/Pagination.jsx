import styled from 'styled-components'
import { Button } from './Button'

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

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1)
  }

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1)
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

export default Pagination
