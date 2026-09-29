import type { Test } from '@lvce-editor/test-with-playwright'
import { expectTraceError } from './_performanceProfileTestUtils.ts'

export const name = 'performance-profile-view.error-invalid-event'

export const test: Test = async (api) => {
  await expectTraceError(api, 'invalid-event', '{"traceEvents":[null]}', 'Performance trace event 0 must be an object')
}
