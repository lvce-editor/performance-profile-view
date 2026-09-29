import * as esbuild from 'esbuild'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { root } from './root.ts'

const extension = path.join(root, 'packages', 'extension')
const entryPoints = {
  performanceProfileParserWorkerMain: path.join(
    root,
    'packages',
    'performance-profile-parser-worker',
    'src',
    'performanceProfileParserWorkerMain.ts',
  ),
  performanceProfileViewMain: path.join(extension, 'src', 'performanceProfileViewMain.ts'),
}
const context = await esbuild.context({
  bundle: true,
  entryPoints,
  external: ['electron', 'node:*'],
  format: 'esm',
  outdir: path.join(extension, 'dist'),
  platform: 'browser',
  sourcemap: true,
  target: 'esnext',
})

await context.rebuild()
await context.watch()

const server = spawn(
  process.execPath,
  [
    path.join(root, 'node_modules', '@lvce-editor', 'server', 'bin', 'server.js'),
    '--only-extension=packages/extension',
    '--test-path=packages/e2e',
  ],
  {
    cwd: root,
    env: { ...process.env, PORT: process.env.PORT || '3000' },
    stdio: 'inherit',
  },
)

const stop = async (): Promise<void> => {
  server.kill()
  await context.dispose()
}

process.on('SIGINT', async () => {
  await stop()
  process.exit(0)
})
process.on('SIGTERM', async () => {
  await stop()
  process.exit(0)
})
server.on('exit', async (code) => {
  await context.dispose()
  process.exit(code ?? 0)
})
