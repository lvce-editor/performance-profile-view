import type { Test } from '@lvce-editor/test-with-playwright'
import { openTrace } from './_performanceProfileTestUtils.ts'

export const name = 'performance-profile-view.opens-chromium-trace'

export const test: Test = async (api) => {
  await openTrace(
    api,
    'eslint-worker',
    JSON.stringify({
      traceEvents: [
        { args: { name: 'LVCE Editor' }, name: 'process_name', ph: 'M', pid: 10 },
        { args: { name: 'ESLint worker' }, name: 'thread_name', ph: 'M', pid: 10, tid: 22 },
        { cat: 'devtools.timeline', dur: 3500, name: 'Lint workspace', ph: 'X', pid: 10, tid: 22, ts: 1000 },
      ],
    }),
  )
  await api.expect(api.Locator('.PerformanceProfileView')).toBeVisible()
  await api.expect(api.Locator('.PerformanceProfileSummary')).toContainText('1 events')
  await api.expect(api.Locator('.PerformanceProfileEventName')).toHaveText('Lint workspace')
  await api.expect(api.Locator('.PerformanceProfileEventDetail')).toContainText('ESLint worker')
  await api.expect(api.Locator('.PerformanceProfileEventBar')).toHaveCount(1)
  await api.expect(api.Locator('.PerformanceProfileEventDuration')).toHaveText('3.50 ms')
}
