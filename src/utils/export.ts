export interface CSVColumn<T> {
  key: keyof T | string
  title: string
  formatter?: (value: unknown, row: T, index: number) => string | number
}

export interface ExportOptions {
  filename?: string
  encoding?: 'utf-8' | 'gbk'
  includeBOM?: boolean
  separator?: string
}

const DEFAULT_OPTIONS: Required<Omit<ExportOptions, 'filename'>> & {
  filename: string
} = {
  filename: 'export',
  encoding: 'utf-8',
  includeBOM: true,
  separator: ',',
}

function escapeCSV(value: unknown, separator: string): string {
  if (value === null || value === undefined) return ''

  const str = String(value)

  const needsQuoting =
    str.includes('"') ||
    str.includes(separator) ||
    str.includes('\n') ||
    str.includes('\r')

  if (needsQuoting) {
    return `"${str.replace(/"/g, '""')}"`
  }

  return str
}

export function dataToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: CSVColumn<T>[],
  separator: string = ','
): string {
  if (!columns || columns.length === 0) return ''

  const headerRow = columns
    .map((col) => escapeCSV(col.title, separator))
    .join(separator)

  const dataRows = (data || []).map((row, rowIndex) =>
    columns
      .map((col) => {
        const rawValue =
          typeof col.key === 'string' ? row[col.key] : row[col.key as keyof T]
        const formattedValue = col.formatter
          ? col.formatter(rawValue, row, rowIndex)
          : rawValue
        return escapeCSV(formattedValue, separator)
      })
      .join(separator)
  )

  return [headerRow, ...dataRows].join('\r\n')
}

export function downloadCSV(
  csvContent: string,
  filename: string = 'export'
): void {
  if (typeof document === 'undefined') return

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], {
    type: 'text/csv;charset=utf-8;',
  })

  const safeFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = safeFilename
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  setTimeout(() => URL.revokeObjectURL(url), 100)
}

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: CSVColumn<T>[],
  options: ExportOptions = {}
): string {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }
  const csv = dataToCSV(data, columns, mergedOptions.separator)

  if (typeof document !== 'undefined') {
    downloadCSV(csv, mergedOptions.filename)
  }

  return csv
}

export function autoColumns<T extends Record<string, unknown>>(
  data: T[]
): CSVColumn<T>[] {
  if (!data || data.length === 0) return []

  const keys = Object.keys(data[0]) as (keyof T)[]
  return keys.map((key) => ({
    key,
    title: String(key),
  }))
}

export function generateFilename(prefix: string = 'report'): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const h = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  return `${prefix}_${y}${m}${d}_${h}${min}.csv`
}
