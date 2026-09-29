import type { TestApi } from '@lvce-editor/test-with-playwright'

export const openTrace = async (
  { FileSystem, Main, Workspace }: TestApi,
  name: string,
  trace: string,
): Promise<void> => {
  const directory = await FileSystem.getTmpDir()
  const uri = `${directory}/${name}.trace`
  await FileSystem.writeFile(uri, trace)
  // The current Electron test runner still exposes setPath at runtime.
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  await Workspace.setPath(directory)
  await Main.openUri(uri)
}

export const expectTraceError = async (
  { expect, FileSystem, Locator, Main, Workspace, ...rest }: TestApi,
  name: string,
  trace: string,
  message: string,
): Promise<void> => {
  await openTrace({ expect, FileSystem, Locator, Main, Workspace, ...rest }, name, trace)
  const error = Locator('.Viewlet.Error')
  await expect(error).toBeVisible()
  await expect(error).toContainText(`Error: ${message}`)
}

export const expectUnreadableTraceError = async ({
  expect,
  FileSystem,
  Locator,
  Main,
  Workspace,
}: TestApi): Promise<void> => {
  const directory = await FileSystem.getTmpDir()
  // The current Electron test runner still exposes setPath at runtime.
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  await Workspace.setPath(directory)
  await Main.openUri(`${directory}/missing.trace`)
  const error = Locator('.Viewlet.Error')
  await expect(error).toBeVisible()
}
