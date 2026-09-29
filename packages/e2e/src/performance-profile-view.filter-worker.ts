import type { Test } from '@lvce-editor/test-with-playwright'
import { openTrace } from './_performanceProfileTestUtils.ts'

export const name = 'performance-profile-view.filter-worker'

export const test: Test = async (api) => {
  const events = Array.from({ length: 5001 }, (_, index) => ({ dur: 1, name: 'Other work', ph: 'X', ts: index }))
  const source = 'lvce-oss://-/extensions/builtin.eslint/dist/eslintEvaluationWorkerMain.js'
  await openTrace(
    api,
    'filter-worker',
    JSON.stringify({
      traceEvents: [...events, { args: { data: { url: source } }, dur: 981, name: 'FunctionCall', ph: 'X', ts: 6000 }],
    }),
  )
  const states = (await api.Command.execute('Viewlet.getAllStates')) as Record<
    string,
    { readonly uid: number; readonly viewId?: string }
  >
  const view = Object.values(states).find(({ viewId }) => viewId === 'builtin.performance-profile-view')
  if (!view) {
    throw new Error('Performance profile view was not created')
  }
  const filter = (value: string): Promise<unknown> =>
    api.Command.execute('Viewlet.executeViewletCommand', view.uid, 'handleInput', 'filter', value)
  await filter('ESLINT')
  await api.expect(api.Locator('.PerformanceProfileFilterStatus')).toContainText('1 matching events')
  await api.expect(api.Locator('.PerformanceProfileEvent')).toHaveCount(1)
  await api.expect(api.Locator('.PerformanceProfileEventDetail')).toContainText(source)
  await api.expect(api.Locator('.PerformanceProfileEventDuration')).toHaveText('0.98 ms')
  await filter('no matching worker')
  await api.expect(api.Locator('.PerformanceProfileFilterStatus')).toContainText('0 matching events')
  await api.expect(api.Locator('.PerformanceProfileEvent')).toHaveCount(0)
  await filter('')
  await api.expect(api.Locator('.PerformanceProfileNotice')).toContainText('first 5,000 events')
  await api.expect(api.Locator('.PerformanceProfileEvent')).toHaveCount(5000)
}
