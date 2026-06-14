export const PROJECT_NO_PREFIX = 'INNO'

export interface ParsedProjectNo {
  prefix: string
  year: number
  sequence: number
  isValid: boolean
}

export function generateProjectNo(sequence: number, year?: number): string {
  const y = year ?? new Date().getFullYear()
  const seq = Math.max(1, Math.floor(sequence))
  const paddedSeq = String(seq).padStart(4, '0')
  return `${PROJECT_NO_PREFIX}-${y}-${paddedSeq}`
}

export function parseProjectNo(projectNo: string): ParsedProjectNo {
  const pattern = /^([A-Z]+)-(\d{4})-(\d{4})$/
  const match = projectNo.match(pattern)

  if (!match) {
    return {
      prefix: '',
      year: 0,
      sequence: 0,
      isValid: false,
    }
  }

  return {
    prefix: match[1],
    year: parseInt(match[2], 10),
    sequence: parseInt(match[3], 10),
    isValid: true,
  }
}

export function isValidProjectNo(projectNo: string): boolean {
  return parseProjectNo(projectNo).isValid
}

export function getYearFromProjectNo(projectNo: string): number | null {
  const parsed = parseProjectNo(projectNo)
  return parsed.isValid ? parsed.year : null
}

export function getSequenceFromProjectNo(projectNo: string): number | null {
  const parsed = parseProjectNo(projectNo)
  return parsed.isValid ? parsed.sequence : null
}

export function getNextProjectNo(
  existingProjectNos: string[],
  year?: number
): string {
  const y = year ?? new Date().getFullYear()

  const sequencesOfYear = existingProjectNos
    .map((no) => parseProjectNo(no))
    .filter((p) => p.isValid && p.year === y)
    .map((p) => p.sequence)

  const maxSeq = sequencesOfYear.length > 0 ? Math.max(...sequencesOfYear) : 0
  return generateProjectNo(maxSeq + 1, y)
}

export function compareProjectNo(a: string, b: string): number {
  const pa = parseProjectNo(a)
  const pb = parseProjectNo(b)

  if (!pa.isValid && !pb.isValid) return 0
  if (!pa.isValid) return 1
  if (!pb.isValid) return -1

  if (pa.year !== pb.year) return pa.year - pb.year
  return pa.sequence - pb.sequence
}
