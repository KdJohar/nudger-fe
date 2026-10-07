import type { AudienceComparisonTrendPoint, AudienceTrendPoint } from '../types/audience'

export function formatMetric(value: number): string {
  return new Intl.NumberFormat('en-IN', { notation: value > 9999 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value)
}

export function formatPercent(value: number): string {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`
}

export function compareMetric(current: number, previous: number): { value: number; direction: 'up' | 'down' | 'flat' } {
  const value = previous === 0 ? (current === 0 ? 0 : 100) : ((current - previous) / previous) * 100
  return { value, direction: value > 0.05 ? 'up' : value < -0.05 ? 'down' : 'flat' }
}

export function formatDelta(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
}

export function chartPoints(values: number[], width = 640, height = 220, inset = 14): string {
  if (!values.length) return ''
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = Math.max(max - min, 1)
  return values.map((value, index) => {
    const x = inset + (index / Math.max(values.length - 1, 1)) * (width - inset * 2)
    const y = height - inset - ((value - min) / range) * (height - inset * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

export function areaPath(values: number[], width = 640, height = 220, inset = 14): string {
  const points = chartPoints(values, width, height, inset)
  if (!points) return ''
  const first = points.split(' ')[0].split(',')
  const last = points.split(' ').at(-1)?.split(',') ?? first
  return `M ${first[0]} ${height - inset} L ${points.replaceAll(',', ' ').replaceAll(' ', ' L ').replace(/ L $/, '')} L ${last[0]} ${height - inset} Z`
}

export function trendValues(trend: AudienceTrendPoint[], key: keyof Pick<AudienceTrendPoint, 'active_subscribers' | 'new_subscribers' | 'unsubscribed_users'>): number[] {
  return trend.map((point) => point[key])
}

export function comparisonValues(trend: AudienceComparisonTrendPoint[], key: 'active_subscribers' | 'previous_active_subscribers'): number[] {
  return trend.map((point) => point[key])
}
