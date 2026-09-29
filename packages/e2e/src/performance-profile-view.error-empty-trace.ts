import type { Test } from '@lvce-editor/test-with-playwright'
import { expectTraceError } from './_performanceProfileTestUtils.ts'

export const name = 'performance-profile-view.error-empty-trace'

export const test: Test = async (api) => {
  await expectTraceError(api, 'empty-trace', '{"traceEvents":[]}', 'Performance trace contains no events')
}
