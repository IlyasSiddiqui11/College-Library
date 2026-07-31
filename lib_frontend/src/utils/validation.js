/**
 * Formats and validates an ISBN string.
 * Strips out spaces and hyphens, and validates if it contains exactly 10 or 13 digits.
 * Returns the cleaned ISBN if valid, or null if invalid.
 * 
 * @param {string} isbn 
 * @returns {string | null}
 */
export function formatAndValidateIsbn(isbn) {
  if (!isbn) return null;
  
  // Remove hyphens and spaces
  const cleanIsbn = isbn.replace(/[\s-]/g, '');
  
  // Check if it's exactly 10 or 13 digits
  if (/^\d{10}$/.test(cleanIsbn) || /^\d{13}$/.test(cleanIsbn)) {
    return cleanIsbn;
  }
  
  return null;
}
