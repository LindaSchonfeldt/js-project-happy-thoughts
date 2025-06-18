/**
 * Utilities for handling emojis in thought messages
 */

// Encode emojis for safe server storage
export const encodeEmojis = (text) => {
  return text.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, (match) => {
    return `[emoji:${encodeURIComponent(match)}]`
  })
}

// Decode emojis for display
export const decodeEmojis = (text) => {
  if (!text) return ''

  return text.replace(/\[emoji:([^\]]+)\]/g, (_, encoded) => {
    try {
      return decodeURIComponent(encoded)
    } catch (e) {
      console.error('Error decoding emoji:', e)
      return '😊' // Fallback emoji
    }
  })
}

/**
 * Gets positions of all emoji in a string
 * @param {string} text - The text to analyze
 * @returns {Array} Array of emoji positions with their content
 */
export const getEmojiPositions = (text) => {
  const positions = []
  const regex = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g
  let match

  while ((match = regex.exec(text)) !== null) {
    positions.push({
      index: match.index,
      emoji: match[0]
    })
  }

  return positions
}

/**
 * Store original message with emoji in localStorage
 * @param {string} thoughtId - The thought ID
 * @param {Object} emojiData - Data about the emojis in the message
 */
export const storeThoughtWithEmoji = (thoughtId, emojiData) => {
  try {
    const storedData = JSON.parse(localStorage.getItem('thoughtEmojis') || '{}')
    storedData[thoughtId] = emojiData
    localStorage.setItem('thoughtEmojis', JSON.stringify(storedData))
  } catch (e) {
    console.error('Error storing emoji data:', e)
  }
}

/**
 * Get the original message with emoji from localStorage
 * @param {string} thoughtId - The thought ID
 * @returns {Object|null} The stored emoji data or null
 */
export const getThoughtWithEmoji = (thoughtId) => {
  try {
    const storedData = JSON.parse(localStorage.getItem('thoughtEmojis') || '{}')
    return storedData[thoughtId] || null
  } catch (e) {
    console.error('Error retrieving emoji data:', e)
    return null
  }
}

/**
 * Restore emoji to a plain message
 * @param {string} plainMessage - The message without emojis
 * @param {Object} emojiData - Data about the emojis to restore
 * @returns {string} The message with emojis restored
 */
export const restoreEmoji = (plainMessage, emojiData) => {
  if (
    !emojiData ||
    !emojiData.emojiPositions ||
    !emojiData.emojiPositions.length
  ) {
    return plainMessage
  }

  // Make a copy of the string as an array to insert emojis
  const chars = [...plainMessage]

  // Insert emojis at their positions, starting from the end to avoid index shifts
  for (let i = emojiData.emojiPositions.length - 1; i >= 0; i--) {
    const { index, emoji } = emojiData.emojiPositions[i]
    chars.splice(index, 0, emoji)
  }

  return chars.join('')
}
