import type { Test } from '@lvce-editor/test-with-playwright'
import { openTrace } from './_performanceProfileTestUtils.ts'

export const name = 'performance-profile-view.large-trace'

export const test: Test = async (api) => {
  const events = Array.from({ length: 6000 }, (_, index) => ({
    dur: 100,
    name: `worker event ${index}`,
    ph: 'X',
    ts: index * 1000,
  }))
  await openTrace(api, 'large-trace', JSON.stringify({ traceEvents: events }))
  await api.expect(api.Locator('.PerformanceProfileEvent')).toHaveCount(5000)
  await api.expect(api.Locator('.PerformanceProfileNotice')).toContainText('first 5,000 events')
}
