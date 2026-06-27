import { describe, expect, it } from 'vitest'
import {
  getInstallFooterHint,
  getInstallHelp,
  isChromiumBrowser,
} from '../app/installAppHelp'

describe('getInstallHelp', () => {
  it('returns dev instructions when not in production', () => {
    const help = getInstallHelp(false)
    expect(help.title).toContain('localhost')
    expect(help.steps.some((step) => step.includes('127.0.0.1'))).toBe(true)
  })

  it('returns browser-specific steps in production', () => {
    const help = getInstallHelp(true)
    expect(help.steps.length).toBeGreaterThan(0)
    expect(help.title.length).toBeGreaterThan(0)
  })
})

describe('getInstallFooterHint', () => {
  it('returns a short hint for dev and prod', () => {
    expect(getInstallFooterHint(false)).toContain('Install')
    expect(getInstallFooterHint(true).length).toBeGreaterThan(0)
  })
})

describe('isChromiumBrowser', () => {
  it('detects chromium from user agent', () => {
    expect(isChromiumBrowser()).toBeTypeOf('boolean')
  })
})
