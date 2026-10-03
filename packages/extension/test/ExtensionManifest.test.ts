import { expect, test } from '@jest/globals'
import { readFileSync } from 'node:fs'

const manifest = JSON.parse(readFileSync(new URL('../extension.json', import.meta.url), 'utf8'))

test('language contributions have ids', () => {
  const languages = manifest.languages ?? []
  for (const language of languages) {
    expect(language).toEqual(expect.objectContaining({ id: expect.any(String) }))
  }
})
