/**
 * Sanitizes input by removing potentially problematic Unicode characters
 * @param {string} input - The user input to sanitize
 * @returns {string} Sanitized input string
 */
export const sanitizeInput = (input) => {
  // Remove potentially problematic characters
  return input.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
}
