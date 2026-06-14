export interface PointsConfig {
  costSavingDivisor: number
  revenueIncreaseDivisor: number
  completionBonus: number
}

export const DEFAULT_POINTS_CONFIG: PointsConfig = {
  costSavingDivisor: 100,
  revenueIncreaseDivisor: 200,
  completionBonus: 50,
}

export interface PointsBreakdown {
  costSavingPoints: number
  revenueIncreasePoints: number
  completionBonus: number
  total: number
}

export function calcCostSavingPoints(
  amount: number,
  divisor: number = DEFAULT_POINTS_CONFIG.costSavingDivisor
): number {
  if (amount <= 0) return 0
  return Math.floor(amount / divisor)
}

export function calcRevenueIncreasePoints(
  amount: number,
  divisor: number = DEFAULT_POINTS_CONFIG.revenueIncreaseDivisor
): number {
  if (amount <= 0) return 0
  return Math.floor(amount / divisor)
}

export function calcCompletionBonus(
  isCompleted: boolean,
  bonus: number = DEFAULT_POINTS_CONFIG.completionBonus
): number {
  return isCompleted ? bonus : 0
}

export function calcTotalPoints(
  costSaving: number = 0,
  revenueIncrease: number = 0,
  isCompleted: boolean = false,
  config: Partial<PointsConfig> = {}
): PointsBreakdown {
  const mergedConfig: PointsConfig = {
    ...DEFAULT_POINTS_CONFIG,
    ...config,
  }

  const costSavingPoints = calcCostSavingPoints(
    costSaving,
    mergedConfig.costSavingDivisor
  )
  const revenueIncreasePoints = calcRevenueIncreasePoints(
    revenueIncrease,
    mergedConfig.revenueIncreaseDivisor
  )
  const completionBonus = calcCompletionBonus(
    isCompleted,
    mergedConfig.completionBonus
  )
  const total = costSavingPoints + revenueIncreasePoints + completionBonus

  return {
    costSavingPoints,
    revenueIncreasePoints,
    completionBonus,
    total,
  }
}

export function formatPoints(points: number): string {
  return `${points} 积分`
}

export interface RankingItem {
  id: string | number
  name: string
  points: number
}

export function sortByPointsDesc<T extends RankingItem>(items: T[]): T[] {
  return [...items].sort((a, b) => b.points - a.points)
}

export function getRank(index: number): string {
  if (index < 0) return '-'
  if (index === 0) return '🥇'
  if (index === 1) return '🥈'
  if (index === 2) return '🥉'
  return `${index + 1}`
}
