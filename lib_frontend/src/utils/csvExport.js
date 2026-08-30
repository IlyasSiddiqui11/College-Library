import Papa from 'papaparse'

/**
 * Generates a CSV file from an array of row objects and triggers a browser download.
 * Uses papaparse for proper RFC 4180 encoding (handles commas, quotes, newlines in values).
 *
 * @param {Object[]} rows    - Array of plain objects to serialize
 * @param {string[]} fields  - Ordered list of keys to include as columns
 * @param {string[]} headers - Human-readable column header labels (same order as fields)
 * @param {string}   filename - Download filename (without extension)
 */
export function downloadCsv(rows, fields, headers, filename) {
  const data = rows.map((row) => {
    const obj = {}
    fields.forEach((field, i) => {
      obj[headers[i]] = row[field] ?? ''
    })
    return obj
  })

  const csv = Papa.unparse(data, { columns: headers })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `${filename}_${Date.now()}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
