import type { AudienceTrendPoint } from '../types/audience'

export interface ChartPoint {
  x: number
  y: number
  value: number
}

export interface ChartScale {
  points: ChartPoint[]
  maxValue: number
  minValue: number
}

export const CHART_WIDTH = 720
export const CHART_HEIGHT = 240
export const CHART_PADDING = { top: 20, right: 18, bottom: 32, left: 42 }

export function scaleValues(values: number[], maximumValue?: number): ChartScale {
  const maxValue = Math.max(maximumValue ?? Math.max(...values, 0), 1)
  const minValue = Math.min(...values, 0)
  const usableWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right
  const usableHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom
  const range = Math.max(maxValue - minValue, 1)
  const points = values.map((value, index) => ({
    x: CHART_PADDING.left + (values.length <= 1 ? usableWidth / 2 : (index / (values.length - 1)) * usableWidth),
    y: CHART_PADDING.top + ((maxValue - value) / range) * usableHeight,
    value,
  }))

  return { points, maxValue, minValue }
}

export function createLinePath(points: ChartPoint[]): string {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ')
}

export function createAreaPath(points: ChartPoint[]): string {
  if (points.length === 0) {
    return ''
  }

  const baseline = CHART_HEIGHT - CHART_PADDING.bottom
  const line = createLinePath(points)
  const lastPoint = points[points.length - 1]
  const firstPoint = points[0]
  if (!firstPoint || !lastPoint) {
    return ''
  }
  return `${line} L ${lastPoint.x.toFixed(2)} ${baseline} L ${firstPoint.x.toFixed(2)} ${baseline} Z`
}

export function formatMetric(value: number): string {
  return new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

export function formatPercent(value: number): string {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`
}

export function formatChartDate(value: string, period: string): string {
  const date = new Date(`${value}T00:00:00`)
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: period === '7d' ? 'short' : undefined,
  }).format(date)
}

export function latestTrendPoint(trend: AudienceTrendPoint[]): AudienceTrendPoint | null {
  return trend.at(-1) ?? null
}
