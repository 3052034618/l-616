export type DateInput = Date | string | number

const pad = (n: number) => String(n).padStart(2, '0')

export function formatDate(
  input: DateInput,
  format: string = 'YYYY-MM-DD'
): string {
  const date = new Date(input)
  if (isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  const seconds = pad(date.getSeconds())

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

export function getDaysRemaining(deadline: DateInput): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(deadline)
  end.setHours(0, 0, 0, 0)

  const diff = end.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function isOverdue(deadline: DateInput): boolean {
  return getDaysRemaining(deadline) < 0
}

export function isToday(input: DateInput): boolean {
  const date = new Date(input)
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

export function getRelativeTime(input: DateInput): string {
  const date = new Date(input)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return '刚刚'
  if (diffMin < 60) return `${diffMin}分钟前`
  if (diffHour < 24) return `${diffHour}小时前`
  if (diffDay < 7) return `${diffDay}天前`
  return formatDate(input)
}

export function getYear(input: DateInput): number {
  return new Date(input).getFullYear()
}

export function getMonth(input: DateInput): number {
  return new Date(input).getMonth() + 1
}

export function addDays(input: DateInput, days: number): Date {
  const date = new Date(input)
  date.setDate(date.getDate() + days)
  return date
}

export function startOfDay(input: DateInput): Date {
  const date = new Date(input)
  date.setHours(0, 0, 0, 0)
  return date
}

export function endOfDay(input: DateInput): Date {
  const date = new Date(input)
  date.setHours(23, 59, 59, 999)
  return date
}
