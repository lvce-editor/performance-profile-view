import type { Test } from '@lvce-editor/test-with-playwright'
import { expectTraceError } from './_performanceProfileTestUtils.ts'

export const name = 'performance-profile-view.error-invalid-json'

export const test: Test = async (api) => {
  await expectTraceError(api, 'invalid-json', '{', 'Performance trace is not valid JSON')
}
