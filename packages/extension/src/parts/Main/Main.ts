import { activate as activateExtensionApi, registerView } from '@lvce-editor/api'
import { dispose as disposeParserWorker } from '../PerformanceProfileParserWorker/PerformanceProfileParserWorker.ts'
import { view } from '../PerformanceProfileView/PerformanceProfileView.ts'

const state = { isActivated: false }

export const activate = async (): Promise<void> => {
  if (state.isActivated) {
    return
  }
  state.isActivated = true
  await activateExtensionApi()
  registerView(view)
}

export const deactivate = async (): Promise<void> => {
  await disposeParserWorker()
}
