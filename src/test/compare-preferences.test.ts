import { beforeEach, describe, expect, it } from 'vitest'
import {
  COMPARE_AUTO_SYNC_KEY,
  loadCompareAutoSync,
  saveCompareAutoSync,
} from '../editor/comparePreferences'

describe('comparePreferences', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('defaults auto-sync to off', () => {
    expect(loadCompareAutoSync()).toBe(false)
  })

  it('persists auto-sync preference', () => {
    saveCompareAutoSync(true)
    expect(loadCompareAutoSync()).toBe(true)
    expect(localStorage.getItem(COMPARE_AUTO_SYNC_KEY)).toBe('1')
  })
})
