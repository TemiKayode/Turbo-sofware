/**
 * Utility functions for exporting data to CSV
 */

export function exportToCSV(data: any[], filename: string, headers?: string[]) {
  if (!data || data.length === 0) {
    alert('No data to export')
    return
  }

  // Get headers from first row if not provided
  const csvHeaders = headers || Object.keys(data[0])
  
  // Create CSV content
  const csvContent = [
    csvHeaders.join(','),
    ...data.map(row => {
      return csvHeaders.map(header => {
        const value = row[header] || ''
        // Escape commas and quotes in values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    })
  ].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

export function exportTableToCSV(columns: any[], data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert('No data to export')
    return
  }

  // Get headers from columns
  const headers = columns.map(col => col.header || col.accessor)
  
  // Extract data values
  const csvData = data.map(row => {
    return columns.map(col => {
      const value = typeof col.accessor === 'function' 
        ? col.accessor(row) 
        : row[col.accessor]
      
      // Convert to string and handle special characters
      const stringValue = String(value || '')
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    })
  })

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...csvData.map(row => row.join(','))
  ].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

