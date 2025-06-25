import React from 'react'
import styled from 'styled-components'

const Tag = styled.span`
  background-color: lightgray;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 10px;
  color: var(--color-text);
  font-weight: 500;
  margin-right: 4px;
  text-transform: lowercase;
`

const StyledTags = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  margin-bottom: 8px;
  flex-wrap: wrap;
`

export const TagList = ({ tags = [] }) => {
  // Check if tags exist and have items
  if (!tags || tags.length === 0) {
    return null
  }

  // Remove duplicates
  const uniqueTags = [...new Set(tags)]

  return (
    <StyledTags>
      {uniqueTags.map((tag, index) => (
        <Tag key={index}>{tag.startsWith('#') ? tag : `#${tag}`}</Tag>
      ))}
    </StyledTags>
  )
}
