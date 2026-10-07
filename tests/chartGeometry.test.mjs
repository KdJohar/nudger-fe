import assert from 'node:assert/strict'
import test from 'node:test'
import { createChartScale, chartCoordinate, buildLinePath, buildAreaPath, formatChartDate } from '../src/lib/chartGeometry.ts'

test('current and previous data share one scale so equal values align', () => {
  const scale = createChartScale([8500, 9500, 7500, 8500])
  assert.equal(chartCoordinate(0, 2, 8500, scale).y, chartCoordinate(1, 2, 8500, scale).y)
  const currentEnd = chartCoordinate(1, 2, 9500, scale)
  const previousEnd = chartCoordinate(1, 2, 8500, scale)
  assert.ok(currentEnd.y < previousEnd.y)
  assert.ok(scale.minimum <= 7500 && scale.maximum >= 9500)
  assert.ok(scale.ticks.every(Number.isInteger))
})

test('flat and zero audiences produce a finite visible scale', () => {
  for (const values of [[0, 0], [9667, 9667], [5]]) {
    const scale = createChartScale(values)
    assert.ok(scale.maximum > scale.minimum)
    assert.ok(!/NaN|Infinity/.test(buildLinePath(values, scale)))
    for (const [index, value] of values.entries()) {
      const point = chartCoordinate(index, values.length, value, scale)
      assert.ok(point.x >= 8 && point.x <= 592 && point.y >= 8 && point.y <= 172)
    }
  }
})

test('missing previous values leave gaps instead of inventing a connecting line', () => {
  const path = buildLinePath([2, undefined, 5], createChartScale([2, 5]))
  assert.equal((path.match(/M/g) || []).length, 2)
  assert.equal((path.match(/L/g) || []).length, 0)
})

test('empty series do not create invalid paths; singleton sits in the center', () => {
  const scale = createChartScale([])
  assert.equal(buildLinePath([], scale), '')
  assert.equal(buildAreaPath([], scale), '')
  assert.equal(chartCoordinate(0, 1, 0, scale).x, 300)
})

test('area fills close against the same baseline as the chart', () => {
  const scale = createChartScale([2, 8])
  assert.ok(buildAreaPath([2, 8], scale).endsWith(' L592,172 L8,172 Z'))
})

test('calendar bucket dates stay the same in eastern and western time zones', () => {
  const originalTimezone = process.env.TZ
  try {
    for (const timezone of ['America/Los_Angeles', 'Asia/Kolkata']) {
      process.env.TZ = timezone
      assert.equal(formatChartDate('2026-10-06'), 'Oct 6')
    }
    assert.equal(formatChartDate('invalid'), 'Date unavailable')
  } finally {
    if (originalTimezone === undefined) delete process.env.TZ
    else process.env.TZ = originalTimezone
  }
})
