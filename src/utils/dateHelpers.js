/**
 * dateHelpers Utility
 * Purpose: Provides helper functions for date formatting and manipulation.
 * Usage: Used by components and hooks for displaying dates.
 * Author: Linda Schonfeldt
 * Last Updated: September 2, 2025
 */
/**
 * Formats a date string into a human-readable format
 * @param {string} dateString - ISO date string to format
 * @returns {string} - Formatted date as relative time or date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date'

  try {
    const date = new Date(dateString)

    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid date'

    // Format as relative time if recent
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minute(s) ago`
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hour(s) ago`
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} day(s) ago`

    // Otherwise format as date
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid date'
  }
}
