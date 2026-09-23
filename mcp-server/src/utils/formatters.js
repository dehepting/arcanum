/**
 * Get current ISO timestamp
 */
export function getCurrentTimestamp() {
  return new Date().toISOString();
}

/**
 * Parse JSON field from database, return default if null/invalid
 */
export function parseJsonField(field, defaultValue = null) {
  if (!field) return defaultValue;
  try {
    return JSON.parse(field);
  } catch (error) {
    console.error('Failed to parse JSON field:', error.message);
    return defaultValue;
  }
}

/**
 * Stringify JSON field for database, return null if falsy
 */
export function stringifyJsonField(value) {
  if (!value) return null;
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.error('Failed to stringify JSON field:', error.message);
    return null;
  }
}

/**
 * Format tool response
 */
export function formatToolResponse(text) {
  return {
    content: [
      {
        type: 'text',
        text,
      },
    ],
  };
}

/**
 * Format tool error response
 */
export function formatErrorResponse(error) {
  return {
    content: [
      {
        type: 'text',
        text: `Error: ${error.message}`,
      },
    ],
    isError: true,
  };
}
