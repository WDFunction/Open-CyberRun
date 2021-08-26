import { } from 'jest'
import { CyberRun } from '@cyberrun/core'

describe('test', () => {
  let cbr: CyberRun

  beforeAll(async () => {
    cbr = new CyberRun(true)
    await cbr.start()
  })

  afterAll(async () => {
    await cbr.stop()
  })

  test('test', () => {
    expect(cbr).not.toBe(null)
  })
})