export type InstallBrowser = 'safari' | 'chromium' | 'firefox' | 'other'

export function isChromiumBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  return detectInstallBrowser() === 'chromium'
}

export function detectInstallBrowser(): InstallBrowser {
  if (typeof navigator === 'undefined') return 'other'
  const ua = navigator.userAgent
  if (/Firefox/i.test(ua)) return 'firefox'
  if (/Safari/i.test(ua) && !/Chrome|Chromium|Edg|OPR/i.test(ua)) return 'safari'
  if (/Chrome|Chromium|Edg|OPR/i.test(ua)) return 'chromium'
  return 'other'
}

export type InstallHelp = {
  title: string
  steps: string[]
}

export function getInstallHelp(isProd: boolean): InstallHelp {
  if (!isProd) {
    return {
      title: 'Install on localhost',
      steps: [
        'PWA install works on http://127.0.0.1:5173 (dev) or http://127.0.0.1:4173 (preview)',
        'Look for the install icon in Chrome’s address bar, or ⋮ → Install Marksmith…',
        'If it does not appear, interact with the page briefly and reload',
      ],
    }
  }

  switch (detectInstallBrowser()) {
    case 'safari':
      return {
        title: 'Add Marksmith to your Dock',
        steps: [
          'In Safari’s menu bar, choose File → Add to Dock…',
          'Or click the Share button in the toolbar → Add to Dock',
          'Launch Marksmith from the Dock like any other app',
        ],
      }
    case 'chromium':
      return {
        title: 'Install Marksmith',
        steps: [
          'Look for the install icon in the address bar (monitor with ↓ or ⊕)',
          'Or open the browser menu (⋮) → Install Marksmith…',
          'If you do not see it yet, use the page for a moment and reload',
        ],
      }
    case 'firefox':
      return {
        title: 'Install on Firefox',
        steps: [
          'Firefox has limited PWA support on desktop',
          'Try Chrome or Edge for the best install experience',
          'Or bookmark this page for quick access',
        ],
      }
    default:
      return {
        title: 'Install Marksmith',
        steps: [
          'Use your browser’s menu to install or add this site to your home screen',
          'Chrome, Edge, and Safari (macOS) support installing as an app',
        ],
      }
  }
}

/** One-line hint for the status bar when the browser install prompt is unavailable. */
export function getInstallFooterHint(isProd: boolean): string {
  if (!isProd) {
    return 'Install: Chrome address bar'
  }

  switch (detectInstallBrowser()) {
    case 'safari':
      return 'Install: File → Add to Dock'
    case 'chromium':
      return 'Install: browser menu'
    case 'firefox':
      return 'Install: try Chrome or Edge'
    default:
      return 'Install as app'
  }
}
