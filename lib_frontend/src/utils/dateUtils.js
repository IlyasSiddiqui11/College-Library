/**
 * Shared date formatting utilities.
 * Avoids scattered inline new Date().toLocaleString() calls across pages.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * "26 Aug 2026, 10:45 AM"
 */
export function formatDateFull(dateString) {
  if (!dateString) return 'N/A'
  const d = new Date(dateString)
  if (isNaN(d)) return 'Invalid date'
  const day = d.getDate()
  const month = MONTHS[d.getMonth()]
  const year = d.getFullYear()
  let hours = d.getHours()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  const minutes = d.getMinutes().toString().padStart(2, '0')
  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`
}

/**
 * "Aug 26, 2026"
 */
export function formatDate(dateString) {
  if (!dateString) return ''
  const d = new Date(dateString)
  if (isNaN(d)) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * "Aug 26, 2026, 10:45 AM"
 */
export function formatDateTime(dateString) {
  if (!dateString) return ''
  const d = new Date(dateString)
  if (isNaN(d)) return ''
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}
