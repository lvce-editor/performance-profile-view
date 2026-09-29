import { createRpc } from '@lvce-editor/api'

interface PerformanceProfileEvent {
  readonly category: string
  readonly duration: number
  readonly name: string
  readonly pid: number
  readonly processName: string
  readonly start: number
  readonly threadName: string
  readonly tid: number
}

interface PerformanceProfile {
  readonly duration: number
  readonly events: readonly PerformanceProfileEvent[]
  readonly ignoredEventCount: number
}

interface Rpc {
  readonly dispose: () => Promise<void> | void
  readonly invoke: (method: string, ...params: readonly unknown[]) => Promise<unknown>
}

export const state: { rpcPromise: Promise<Rpc> | undefined } = { rpcPromise: undefined }

const getRpc = (): Promise<Rpc> => {
  state.rpcPromise ??= createRpc({ id: 'builtin.performance-profile-view.parser-worker' }) as Promise<Rpc>
  return state.rpcPromise
}

export const parsePerformanceProfile = async (content: string): Promise<PerformanceProfile> => {
  const rpc = await getRpc()
  return rpc.invoke('PerformanceProfileParser.parse', content) as Promise<PerformanceProfile>
}

export const dispose = async (): Promise<void> => {
  const { rpcPromise } = state
  state.rpcPromise = undefined
  if (rpcPromise) {
    const rpc = await rpcPromise
    await rpc.dispose()
  }
}
