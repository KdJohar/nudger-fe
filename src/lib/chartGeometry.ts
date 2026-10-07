export interface ChartDatum {
  date: string
  value: number
  comparisonValue?: number
  comparisonDate?: string
}

export interface ChartScale {
  minimum: number
  maximum: number
  ticks: number[]
}

export function createChartScale(values: number[]): ChartScale {
  const finiteValues = values.filter(Number.isFinite)
  if (!finiteValues.length) return { minimum: 0, maximum: 1, ticks: [0, 1] }
  const lowest = Math.min(...finiteValues)
  const highest = Math.max(...finiteValues)
  const padding = Math.max(highest - lowest, highest * 0.05, 1) * 0.12
  const lowerBound = lowest >= 0 ? Math.max(0, lowest - padding) : lowest - padding
  const upperBound = highest + padding
  const rawStep = (upperBound - lowerBound) / 4
  const magnitude = Math.max(1, 10 ** Math.floor(Math.log10(rawStep)))
  const step = ([1, 2, 5, 10].find(multiplier => multiplier * magnitude >= rawStep) ?? 10) * magnitude
  const minimum = Math.floor(lowerBound / step) * step
  const maximum = Math.max(minimum + step, Math.ceil(upperBound / step) * step)
  const ticks = Array.from({ length: Math.round((maximum - minimum) / step) + 1 }, (_, index) => minimum + index * step)
  return { minimum, maximum, ticks }
}

export function chartCoordinate(index: number, count: number, value: number, scale: ChartScale) {
  return {
    x: count <= 1 ? 300 : 8 + index / (count - 1) * 584,
    y: 172 - (value - scale.minimum) / (scale.maximum - scale.minimum) * 164,
  }
}

export function buildLinePath(values: (number | undefined)[], scale: ChartScale): string {
  let isSegmentStart = true
  return values.map((value, index) => {
    if (value === undefined || !Number.isFinite(value)) {
      isSegmentStart = true
      return ''
    }
    const { x, y } = chartCoordinate(index, values.length, value, scale)
    const command = isSegmentStart ? 'M' : 'L'
    isSegmentStart = false
    return command + x.toFixed(2) + ',' + y.toFixed(2)
  }).filter(Boolean).join(' ')
}

export function buildAreaPath(values: number[], scale: ChartScale): string {
  if (!values.length) return ''
  const first = chartCoordinate(0, values.length, values[0], scale)
  const last = chartCoordinate(values.length - 1, values.length, values[values.length - 1], scale)
  return buildLinePath(values, scale) + ' L' + last.x + ',172 L' + first.x + ',172 Z'
}

export function formatChartDate(value: string, includeYear = false): string {
  // API dates are calendar-day buckets: UTC formatting avoids shifting them a day west of UTC.
  const date = new Date(value.slice(0, 10) + 'T00:00:00Z')
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return new Intl.DateTimeFormat('en', {
    month: 'short', day: 'numeric', ...(includeYear ? { year: 'numeric' } : {}), timeZone: 'UTC',
  }).format(date)
}
