/* eslint-disable virtual-dom/prefer-state-destructuring */

export interface PerformanceProfileEvent {
  readonly category: string
  readonly duration: number
  readonly name: string
  readonly pid: number
  readonly processName: string
  readonly source?: string
  readonly start: number
  readonly threadName: string
  readonly tid: number
}

export interface PerformanceProfile {
  readonly duration: number
  readonly events: readonly PerformanceProfileEvent[]
  readonly ignoredEventCount: number
}

interface RawEvent {
  readonly args?: unknown
  readonly cat?: unknown
  readonly dur?: unknown
  readonly name?: unknown
  readonly ph?: unknown
  readonly pid?: unknown
  readonly tid?: unknown
  readonly ts?: unknown
}

interface EventRecord {
  readonly pid: number
  readonly raw: RawEvent
  readonly tid: number
}

interface PendingEvent {
  readonly category: string
  readonly name: string
  readonly pid: number
  readonly start: number
  readonly tid: number
}

interface ParseState {
  readonly beginEvents: Map<string, PendingEvent[]>
  readonly events: PerformanceProfileEvent[]
  ignoredEventCount: number
  readonly processNames: Map<number, string>
  readonly threadNames: Map<string, string>
}

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const requireNumber = (value: unknown, label: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`Performance trace event ${label} must be a finite number`)
  }
  return value
}

const getRawEvents = (parsed: unknown): readonly unknown[] => {
  if (Array.isArray(parsed)) {
    return parsed
  }
  if (isRecord(parsed) && Array.isArray(parsed.traceEvents)) {
    return parsed.traceEvents
  }
  throw new TypeError('Performance trace must be an array or an object with a traceEvents array')
}

const readEventRecords = (rawEvents: readonly unknown[]): readonly EventRecord[] => {
  return rawEvents.map((value, index) => {
    if (!isRecord(value)) {
      throw new TypeError(`Performance trace event ${index} must be an object`)
    }
    const raw = value as RawEvent
    return {
      pid: raw.pid === undefined ? 0 : requireNumber(raw.pid, 'pid'),
      raw,
      tid: raw.tid === undefined ? 0 : requireNumber(raw.tid, 'tid'),
    }
  })
}

const readMetadataName = (raw: RawEvent): string | undefined => {
  if (raw.ph !== 'M' || !isRecord(raw.args) || typeof raw.args.name !== 'string') {
    return undefined
  }
  return raw.args.name
}

const collectMetadata = (records: readonly EventRecord[], state: ParseState): void => {
  for (const { pid, raw, tid } of records) {
    const metadataName = readMetadataName(raw)
    if (raw.name === 'process_name' && metadataName) {
      state.processNames.set(pid, metadataName)
    }
    if (raw.name === 'thread_name' && metadataName) {
      state.threadNames.set(`${pid}:${tid}`, metadataName)
    }
  }
}

const readName = (raw: RawEvent): string => {
  return typeof raw.name === 'string' && raw.name ? raw.name : '(unnamed event)'
}

const getSource = (raw: RawEvent): string | undefined => {
  if (!isRecord(raw.args)) {
    return undefined
  }
  const data = isRecord(raw.args.data) ? raw.args.data : undefined
  const url = data?.url ?? raw.args.fileName
  return typeof url === 'string' && url ? url : undefined
}

const createProfileEvent = (
  state: ParseState,
  record: EventRecord,
  name: string,
  start: number,
  duration: number,
  category: string,
): PerformanceProfileEvent => {
  const { pid, tid } = record
  const source = getSource(record.raw)
  return {
    ...(source && { source }),
    category,
    duration,
    name,
    pid,
    processName: state.processNames.get(pid) ?? `Process ${pid}`,
    start,
    threadName: state.threadNames.get(`${pid}:${tid}`) ?? `Thread ${tid}`,
    tid,
  }
}

const getPairKey = (record: EventRecord, name: string): string => {
  return `${record.pid}:${record.tid}:${name}`
}

const addBeginEvent = (record: EventRecord, state: ParseState, name: string, start: number, category: string): void => {
  const key = getPairKey(record, name)
  const stack = state.beginEvents.get(key) ?? []
  stack.push({ category, name, pid: record.pid, start, tid: record.tid })
  state.beginEvents.set(key, stack)
}

const addEndEvent = (record: EventRecord, state: ParseState, name: string, end: number): void => {
  const key = getPairKey(record, name)
  const stack = state.beginEvents.get(key)
  const begin = stack?.pop()
  if (!begin) {
    state.ignoredEventCount++
    return
  }
  if (stack?.length === 0) {
    state.beginEvents.delete(key)
  }
  if (end < begin.start) {
    throw new TypeError(`Performance trace event ${name} ends before it starts`)
  }
  state.events.push(createProfileEvent(state, record, name, begin.start, end - begin.start, begin.category))
}

const addCompleteEvent = (
  record: EventRecord,
  state: ParseState,
  name: string,
  start: number,
  category: string,
): void => {
  const duration = requireNumber(record.raw.dur, 'dur')
  if (duration < 0) {
    throw new TypeError(`Performance trace event ${name} duration must be non-negative`)
  }
  state.events.push(createProfileEvent(state, record, name, start, duration, category))
}

const processRecord = (record: EventRecord, state: ParseState): void => {
  const { raw } = record
  const phase = raw.ph
  if (phase === 'M') {
    return
  }
  const start = requireNumber(raw.ts, 'ts')
  const name = readName(raw)
  const category = typeof raw.cat === 'string' ? raw.cat : ''
  if (phase === 'B') {
    addBeginEvent(record, state, name, start, category)
    return
  }
  if (phase === 'E') {
    addEndEvent(record, state, name, start)
    return
  }
  if (phase === 'X') {
    addCompleteEvent(record, state, name, start, category)
    return
  }
  if (phase === 'i' || phase === 'I') {
    state.events.push(createProfileEvent(state, record, name, start, 0, category))
    return
  }
  state.ignoredEventCount++
}

const getDuration = (events: readonly PerformanceProfileEvent[]): number => {
  const first = events[0]
  let start = first?.start ?? 0
  let end = start
  for (const event of events) {
    start = Math.min(start, event.start)
    end = Math.max(end, event.start + event.duration)
  }
  return end - start
}

export const parsePerformanceProfile = (content: string): PerformanceProfile => {
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new TypeError('Performance trace is not valid JSON')
  }
  const rawEvents = getRawEvents(parsed)
  if (rawEvents.length === 0) {
    throw new TypeError('Performance trace contains no events')
  }
  const records = readEventRecords(rawEvents)
  const state: ParseState = {
    beginEvents: new Map(),
    events: [],
    ignoredEventCount: 0,
    processNames: new Map(),
    threadNames: new Map(),
  }
  collectMetadata(records, state)
  for (const record of records) {
    processRecord(record, state)
  }
  if (state.events.length === 0) {
    throw new TypeError('Performance trace contains no supported timeline events')
  }
  state.events.sort((left, right) => left.start - right.start)
  return { duration: getDuration(state.events), events: state.events, ignoredEventCount: state.ignoredEventCount }
}
