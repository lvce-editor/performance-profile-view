import * as esbuild from 'esbuild'
import fs from 'node:fs'
import path from 'node:path'
import { root } from './root.ts'

const extension = path.join(root, 'packages', 'extension')
const outDirectory = path.join(extension, 'dist')
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

fs.rmSync(outDirectory, { force: true, recursive: true })
fs.mkdirSync(outDirectory, { recursive: true })

await esbuild.build({
  bundle: true,
  entryPoints,
  external: ['electron', 'node:*'],
  format: 'esm',
  outdir: outDirectory,
  platform: 'browser',
  sourcemap: true,
  target: 'esnext',
})
