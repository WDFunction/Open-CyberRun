import { } from 'jest'
import { CyberRun } from '@cyberrun/core'

describe('test', () => {
  let cbr: CyberRun

  beforeAll(async () => {
    cbr = new CyberRun()
    await cbr.start()
  })

  test('test', () => {
    expect(cbr).not.toBe(null)
  })
})