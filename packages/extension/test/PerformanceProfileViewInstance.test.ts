import { expect, test } from '@jest/globals'
import { createInstanceWithDependencies } from '../src/parts/PerformanceProfileViewInstance/PerformanceProfileViewInstance.ts'

test('renders trace event labels and remembers the opened URI', async () => {
  const instance = await createInstanceWithDependencies(
    {
      requestRerender: async () => {},
      showContextMenu: async () => {},
      uid: 1,
      uri: '/profiles/eslint.trace',
      viewId: 'builtin.performance-profile-view',
    },
    {
      parse: async () => ({
        duration: 3000,
        events: [
          {
            category: 'devtools.timeline',
            duration: 3000,
            name: 'Lint workspace',
            pid: 1,
            processName: 'LVCE Editor',
            start: 1000,
            threadName: 'ESLint worker',
            tid: 2,
          },
        ],
        ignoredEventCount: 1,
      }),
      readFile: async () => '[trace]',
    },
  )

  expect(instance.saveState()).toEqual({ uri: '/profiles/eslint.trace' })
  const nodes = instance.render()
  expect(nodes.some((node) => 'className' in node && node.className === 'PerformanceProfileView')).toBe(true)
  expect(nodes.some((node) => 'className' in node && node.className === 'PerformanceProfileEventName')).toBe(true)
  expect(nodes.some((node) => 'text' in node && node.text === 'Lint workspace')).toBe(true)
  expect(
    nodes.some((node) => 'text' in node && typeof node.text === 'string' && node.text.includes('ESLint worker')),
  ).toBe(true)
  instance.handleEvent?.({ type: 'click' })
  instance.dispose?.()
})

test('bounds DOM rendering for large traces and supports a missing URI', async () => {
  const instance = await createInstanceWithDependencies(undefined, {
    parse: async () => ({
      duration: 100_000,
      events: Array.from({ length: 5001 }, (_, index) => ({
        category: '',
        duration: 1,
        name: `event ${index}`,
        pid: 1,
        processName: 'Process 1',
        start: index * 20,
        threadName: 'Thread 2',
        tid: 2,
      })),
      ignoredEventCount: 0,
    }),
    readFile: async (uri) => {
      expect(uri).toBe('')
      return ''
    },
  })
  const nodes = instance.render()
  expect(nodes.filter((node) => 'className' in node && node.className === 'PerformanceProfileEvent')).toHaveLength(5000)
  expect(
    nodes.some((node) => 'text' in node && typeof node.text === 'string' && node.text.includes('first 5,000 events')),
  ).toBe(true)
  instance.handleEvent?.({ type: 'input', name: 'filter', value: 'EVENT 5000' })
  const filtered = instance.render()
  expect(filtered.filter((node) => 'className' in node && node.className === 'PerformanceProfileEvent')).toHaveLength(1)
  expect(filtered.some((node) => 'text' in node && node.text === 'event 5000')).toBe(true)
  instance.handleEvent?.({ type: 'input', name: 'filter', value: 'no matching event' })
  expect(
    instance.render().filter((node) => 'className' in node && node.className === 'PerformanceProfileEvent'),
  ).toHaveLength(0)
  instance.handleEvent?.({ type: 'input', name: 'filter', value: '' })
  expect(
    instance.render().filter((node) => 'className' in node && node.className === 'PerformanceProfileEvent'),
  ).toHaveLength(5000)
})
