import type { Test } from '@lvce-editor/test-with-playwright'
import { openTrace } from './_performanceProfileTestUtils.ts'

export const name = 'performance-profile-view.recovers-after-error'

export const test: Test = async (api) => {
  const viewletError = api.Locator('.Viewlet.Error')
  await openTrace(api, 'recover-invalid', '{')
  await api.expect(viewletError).toBeVisible()
  await openTrace(api, 'recover-valid', '[{"name":"recovered event","ph":"X","ts":1,"dur":2}]')
  await api.expect(api.Locator('.PerformanceProfileEventName')).toHaveText('recovered event')
}
