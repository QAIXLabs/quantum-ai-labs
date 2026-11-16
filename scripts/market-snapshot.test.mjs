import { test } from 'node:test'
import assert from 'node:assert/strict'
import { marketSnapshot } from '../src/features/home/marketSnapshot.ts'

const candles = Array.from({ length: 25 }, (_, i) => ({ time: 1_700_000_000 + i * 3600, close: 100 + i }))

test('uses the latest 25 hourly observations for a full 24-hour change', () => {
  const snapshot = marketSnapshot([{ time: candles[0].time - 3600, close: 50 }, ...candles])
  assert.equal(snapshot.last, 124)
  assert.equal(snapshot.change, 24)
  assert.equal(snapshot.closes.length, 25)
})

test('shows partial data without inventing a 24-hour change', () => {
  assert.equal(marketSnapshot(candles.slice(-3)).last, 124)
  assert.equal(marketSnapshot(candles.slice(-3)).change, null)
  assert.equal(marketSnapshot([candles[0]]).change, null)
})

test('rejects empty, nonfinite, and nonpositive market readings', () => {
  for (const input of [undefined, [], [{ time: 0, close: NaN }], [{ time: 0, close: 0 }], [{ time: Infinity, close: 1 }], [{ time: 0, close: -1 }]]) {
    assert.throws(() => marketSnapshot(input), /No valid market data/)
  }
})

test('does not present missing, reordered, or duplicated candles as a full day', () => {
  const missing = candles.map((c, i) => ({ ...c, time: c.time + (i === 12 ? 30 : 0) }))
  assert.equal(marketSnapshot(missing).change, null)
  assert.equal(marketSnapshot([...candles].reverse()).change, null)
})

test('reports a flat series as zero change', () => {
  assert.equal(marketSnapshot(candles.map(c => ({ ...c, close: 100 }))).change, 0)
})
