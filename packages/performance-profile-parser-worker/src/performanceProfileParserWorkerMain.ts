import { WebWorkerRpcClient, type Rpc } from '@lvce-editor/rpc'
import * as CommandMap from './parts/CommandMap/CommandMap.ts'

export { commandMap } from './parts/CommandMap/CommandMap.ts'

const globalScope = globalThis as typeof globalThis & { rpc?: Rpc }

if (!globalScope.rpc) {
  globalScope.rpc = await WebWorkerRpcClient.create({ commandMap: CommandMap.commandMap })
}
