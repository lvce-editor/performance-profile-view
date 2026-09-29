import type { Test } from '@lvce-editor/test-with-playwright'
import { expectUnreadableTraceError } from './_performanceProfileTestUtils.ts'

export const name = 'performance-profile-view.error-unreadable-file'

export const test: Test = async (api) => {
  await expectUnreadableTraceError(api)
}
