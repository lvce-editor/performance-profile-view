import { expect, test } from '@jest/globals'
import { parsePerformanceProfile } from '../src/parts/ParsePerformanceProfile/ParsePerformanceProfile.ts'

test('parses complete events and thread metadata', () => {
  const profile = parsePerformanceProfile(
    JSON.stringify({
      traceEvents: [
        { args: { name: 'ESLint worker' }, name: 'thread_name', ph: 'M', pid: 2, tid: 4 },
        { cat: 'devtools.timeline', dur: 2500, name: 'Lint project', ph: 'X', pid: 2, tid: 4, ts: 1000 },
      ],
    }),
  )
  expect(profile.duration).toBe(2500)
  expect(profile.events).toEqual([
    {
      category: 'devtools.timeline',
      duration: 2500,
      name: 'Lint project',
      pid: 2,
      processName: 'Process 2',
      start: 1000,
      threadName: 'ESLint worker',
      tid: 4,
    },
  ])
})

test('pairs begin and end events', () => {
  const profile = parsePerformanceProfile(
    JSON.stringify([
      { name: 'work', ph: 'B', pid: 1, tid: 2, ts: 10 },
      { name: 'work', ph: 'E', pid: 1, tid: 2, ts: 40 },
    ]),
  )
  expect(profile.events[0]?.duration).toBe(30)
})

test('rejects malformed JSON', () => {
  expect(() => parsePerformanceProfile('{')).toThrow('Performance trace is not valid JSON')
})

test('rejects a trace without the traceEvents array', () => {
  expect(() => parsePerformanceProfile('{"traceEvents":{}}')).toThrow('traceEvents array')
})

test('rejects empty and unsupported traces', () => {
  expect(() => parsePerformanceProfile('{"traceEvents":[]}')).toThrow('no events')
  expect(() => parsePerformanceProfile('[{"name":"meta","ph":"M","ts":0}]')).toThrow('no supported timeline events')
})

test('rejects invalid event timestamps', () => {
  expect(() => parsePerformanceProfile('[{"name":"work","ph":"X","ts":"soon","dur":1}]')).toThrow(
    'ts must be a finite number',
  )
})

test('keeps large event streams in timestamp order', () => {
  const events = Array.from({ length: 20_000 }, (_, index) => ({
    dur: 1,
    name: `event ${index}`,
    ph: 'X',
    ts: 20_000 - index,
  }))
  const profile = parsePerformanceProfile(JSON.stringify({ traceEvents: events }))
  expect(profile.events).toHaveLength(20_000)
  expect(profile.events[0]?.name).toBe('event 19999')
})

test('preserves Chromium function-call source URLs with generic worker names', () => {
  const source = 'lvce-oss://-/extensions/builtin.eslint/dist/eslintEvaluationWorkerMain.js'
  const profile = parsePerformanceProfile(
    JSON.stringify([
      { args: { name: 'DedicatedWorker thread' }, name: 'thread_name', ph: 'M', pid: 1, tid: 2 },
      { args: { data: { url: source } }, dur: 981, name: 'FunctionCall', ph: 'X', pid: 1, tid: 2, ts: 10 },
    ]),
  )
  expect(profile.events[0]).toMatchObject({ duration: 981, source, threadName: 'DedicatedWorker thread' })
})
