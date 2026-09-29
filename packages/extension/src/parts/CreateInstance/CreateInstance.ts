import type { ViewContext } from '@lvce-editor/api'
import { readFile } from '@lvce-editor/api'
import { parsePerformanceProfile } from '../PerformanceProfileParserWorker/PerformanceProfileParserWorker.ts'
import {
  createInstanceWithDependencies,
  type PerformanceProfileViewInstance,
} from '../PerformanceProfileViewInstance/PerformanceProfileViewInstance.ts'

interface PerformanceProfileViewContext extends ViewContext {
  readonly uri?: string
}

export const createInstance = (context?: PerformanceProfileViewContext): Promise<PerformanceProfileViewInstance> => {
  return createInstanceWithDependencies(context, { parse: parsePerformanceProfile, readFile })
}
