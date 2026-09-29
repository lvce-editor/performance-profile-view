import type { View } from '@lvce-editor/api'
import type { PerformanceProfileViewInstance } from '../PerformanceProfileViewInstance/PerformanceProfileViewInstance.ts'
import { createInstance } from '../CreateInstance/CreateInstance.ts'

export const viewId = 'builtin.performance-profile-view'

export const view: View<PerformanceProfileViewInstance> = {
  create: createInstance,
  id: viewId,
  kind: 'virtualDom',
  title: 'Performance Profile',
}
