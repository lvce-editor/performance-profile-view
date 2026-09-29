import type { Test } from '@lvce-editor/test-with-playwright'
import { expectTraceError } from './_performanceProfileTestUtils.ts'

export const name = 'performance-profile-view.error-unsupported-events'

export const test: Test = async (api) => {
  await expectTraceError(
    api,
    'unsupported-events',
    '[{"name":"marker","ph":"M","ts":0}]',
    'Performance trace contains no supported timeline events',
  )
}
