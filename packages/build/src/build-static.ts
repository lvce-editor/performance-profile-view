import { cp, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { root } from './root.ts'

const extensionId = 'builtin.performance-profile-view'
const extensionDist = join(root, '.tmp', 'extension')
const staticDist = join(root, '.tmp', 'static')

const serverRequire = createRequire(join(root, 'packages', 'server', 'package.json'))
const { exportStatic } = serverRequire('@lvce-editor/shared-process')

await import('./build.ts')

await rm(extensionDist, { force: true, recursive: true })
await cp(join(root, 'dist'), extensionDist, { recursive: true })

process.env.PATH_PREFIX = '/performance-profile-view'
const { commitHash } = await exportStatic({
  extensionPath: 'packages/extension',
  root,
  testPath: 'packages/e2e',
})

await cp(extensionDist, join(root, 'dist', commitHash, 'extensions', extensionId), { force: true, recursive: true })

await rm(staticDist, { force: true, recursive: true })
await cp(join(root, 'dist'), staticDist, { recursive: true })
