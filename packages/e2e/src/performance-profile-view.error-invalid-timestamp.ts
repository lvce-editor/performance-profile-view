import type { Test } from '@lvce-editor/test-with-playwright'
import { expectTraceError } from './_performanceProfileTestUtils.ts'

export const name = 'performance-profile-view.error-invalid-timestamp'

export const test: Test = async (api) => {
  await expectTraceError(
    api,
    'invalid-timestamp',
    '{"traceEvents":[{"name":"work","ph":"X","ts":"soon","dur":1}]}',
    'Performance trace event ts must be a finite number',
  )
}
