import type { Test } from '@lvce-editor/test-with-playwright'
import { expectTraceError } from './_performanceProfileTestUtils.ts'

export const name = 'performance-profile-view.error-invalid-shape'

export const test: Test = async (api) => {
  await expectTraceError(
    api,
    'invalid-shape',
    '{"traceEvents":{}}',
    'Performance trace must be an array or an object with a traceEvents array',
  )
}
