export const COMPARE_AUTO_SYNC_KEY = 'marksmith:compare-auto-sync'

export function loadCompareAutoSync(): boolean {
  try {
    return localStorage.getItem(COMPARE_AUTO_SYNC_KEY) === '1'
  } catch {
    return false
  }
}

export function saveCompareAutoSync(enabled: boolean): void {
  try {
    localStorage.setItem(COMPARE_AUTO_SYNC_KEY, enabled ? '1' : '0')
  } catch {
    // ignore
  }
}
