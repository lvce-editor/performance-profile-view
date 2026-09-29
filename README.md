# Performance Profile View

Performance Profile View opens Chromium trace-event files inside LVCE Editor. Use **Developer: Start Content Tracing**, exercise the editor or a built-in worker such as ESLint, then choose **Developer: Stop Content Tracing**. LVCE saves the trace and opens it in the viewer.

## Supported trace data

The viewer reads either a Chromium trace object with a `traceEvents` array or a bare array of trace events. It displays complete (`X`), begin/end (`B`/`E`), and instant (`i`/`I`) events. Chromium process and thread name metadata supplies readable row labels. Event timestamps and durations use Chromium's microsecond units and are shown as milliseconds.

Metadata and unsupported event phases are omitted. Invalid JSON, invalid event records, empty traces, and traces without supported timeline events show a parse error in the editor. Large traces are parsed in a worker; the view renders at most 5,000 events at a time to keep the editor responsive and states when the display is truncated.

## Development

This repository uses npm workspaces. `npm run build` packages the extension, `npm test` runs parser and view unit tests, `npm run type-check` checks TypeScript, `npm run lint` runs ESLint, Prettier, and Knip, and `npm run e2e:headless` runs browser acceptance tests.
