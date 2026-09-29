import type { ViewContext, ViewEvent, VirtualDomViewInstance } from '@lvce-editor/api'
import { VirtualDomElements, type VirtualDomNode, text } from '@lvce-editor/virtual-dom-worker'

interface PerformanceProfileEvent {
  readonly category: string
  readonly duration: number
  readonly name: string
  readonly processName: string
  readonly source?: string
  readonly start: number
  readonly threadName: string
}

interface PerformanceProfile {
  readonly duration: number
  readonly events: readonly PerformanceProfileEvent[]
  readonly ignoredEventCount: number
}

interface Dependencies {
  readonly parse: (content: string) => Promise<PerformanceProfile>
  readonly readFile: (uri: string) => Promise<string>
}

interface PerformanceProfileViewContext extends ViewContext {
  readonly uri?: string
}

export interface PerformanceProfileViewInstance extends VirtualDomViewInstance {
  readonly render: () => readonly VirtualDomNode[]
  readonly saveState: () => { readonly uri: string }
}

const formatTime = (microseconds: number): string => {
  const milliseconds = microseconds / 1000
  return `${milliseconds.toFixed(milliseconds < 10 ? 2 : 1)} ms`
}

const eventNode = { childCount: 4, className: 'PerformanceProfileEvent', type: VirtualDomElements.Div }
const eventNameNode = { childCount: 1, className: 'PerformanceProfileEventName', type: VirtualDomElements.Span }
const eventDetailNode = { childCount: 1, className: 'PerformanceProfileEventDetail', type: VirtualDomElements.Span }
const eventStartNode = { childCount: 1, className: 'PerformanceProfileEventStart', type: VirtualDomElements.Span }
const eventDurationNode = { childCount: 1, className: 'PerformanceProfileEventDuration', type: VirtualDomElements.Span }
const eventTrackNode = {
  childCount: 1,
  className: 'PerformanceProfileEventTrack',
  preserveAspectRatio: 'none',
  type: VirtualDomElements.Svg,
  viewBox: '0 0 100 10',
}
const handleInput = 'handleInput'
const summaryNode = { childCount: 1, className: 'PerformanceProfileSummary', type: VirtualDomElements.Div }
const noticeNode = { childCount: 1, className: 'PerformanceProfileNotice', type: VirtualDomElements.Div }

const renderEvent = (event: PerformanceProfileEvent, traceStart: number, traceDuration: number): VirtualDomNode[] => {
  const detail = event.category
    ? `${event.processName} · ${event.threadName} · ${event.category}`
    : `${event.processName} · ${event.threadName}`
  const left = Math.min(100, Math.max(0, ((event.start - traceStart) / traceDuration) * 100))
  const width = Math.min(100 - left, Math.max(0.5, (event.duration / traceDuration) * 100))
  return [
    { ...eventNode, childCount: 5 },
    eventNameNode,
    text(event.name),
    { ...eventDetailNode, title: event.source || detail },
    text(event.source ? `${detail} · ${event.source}` : detail),
    eventTrackNode,
    {
      childCount: 0,
      className: 'PerformanceProfileEventBar',
      height: 8,
      rx: 2,
      type: VirtualDomElements.Rect,
      width,
      x: left,
      y: 1,
    },
    eventStartNode,
    text(formatTime(event.start)),
    eventDurationNode,
    text(formatTime(event.duration)),
  ]
}

const renderEventGroups = (
  events: readonly PerformanceProfileEvent[],
  traceStart: number,
  traceDuration: number,
): VirtualDomNode[] => {
  const nodes: VirtualDomNode[] = []
  for (let start = 0; start < events.length; start += 100) {
    const group = events.slice(start, start + 100)
    nodes.push({ childCount: group.length, className: 'PerformanceProfileEventGroup', type: VirtualDomElements.Div })
    nodes.push(...group.flatMap((event) => renderEvent(event, traceStart, traceDuration)))
  }
  return nodes
}

const render = (profile: PerformanceProfile, filter: string): readonly VirtualDomNode[] => {
  const query = filter.toLowerCase()
  const matchingEvents = query
    ? profile.events.filter((event) =>
        [event.name, event.category, event.processName, event.threadName, event.source ?? ''].some((value) =>
          value.toLowerCase().includes(query),
        ),
      )
    : profile.events
  const visibleEvents = matchingEvents.slice(0, 5000)
  const traceStart = profile.events[0]?.start ?? 0
  const traceDuration = Math.max(profile.duration, 1)
  const heading = `Chromium performance trace · ${profile.events.length.toLocaleString()} events · ${formatTime(profile.duration)} total`
  const parts = [
    [summaryNode, text(heading)],
    [
      {
        ariaLabel: 'Filter trace events',
        childCount: 0,
        className: 'PerformanceProfileFilter',
        inputType: 'search',
        name: 'filter',
        onInput: handleInput,
        placeholder: 'Filter events, workers, or source URLs',
        type: VirtualDomElements.Input,
        value: filter,
      },
    ],
    [
      { ...noticeNode, className: 'PerformanceProfileFilterStatus' },
      text(`${matchingEvents.length.toLocaleString()} matching events`),
    ],
    ...(profile.ignoredEventCount
      ? [
          [
            noticeNode,
            text(`${profile.ignoredEventCount.toLocaleString()} metadata or unsupported events were omitted.`),
          ],
        ]
      : []),
    [
      {
        childCount: Math.ceil(visibleEvents.length / 100),
        className: 'PerformanceProfileEventList',
        type: VirtualDomElements.Div,
      },
      ...renderEventGroups(visibleEvents, traceStart, traceDuration),
    ],
    ...(visibleEvents.length < matchingEvents.length
      ? [
          [
            noticeNode,
            text(
              `Showing the first ${visibleEvents.length.toLocaleString()} events. ${matchingEvents.length.toLocaleString()} events match the current filter.`,
            ),
          ],
        ]
      : []),
  ]
  return [
    { childCount: parts.length, className: 'PerformanceProfileView', type: VirtualDomElements.Div },
    ...parts.flat(),
  ]
}

export const createInstanceWithDependencies = async (
  context: PerformanceProfileViewContext | undefined,
  dependencies: Dependencies,
): Promise<PerformanceProfileViewInstance> => {
  const uri = typeof context?.uri === 'string' ? context.uri : ''
  const content = await dependencies.readFile(uri)
  const profile = await dependencies.parse(content)
  let filter = ''
  return {
    dispose(): void {},
    handleEvent(event: Readonly<ViewEvent>): void {
      if (event.type === 'input' && event.name === 'filter' && typeof event.value === 'string') {
        filter = event.value
      }
    },
    render: () => render(profile, filter),
    saveState: () => ({ uri }),
  }
}
