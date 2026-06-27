import { isTauri } from '@tauri-apps/api/core'

export { isTauri }

export function isDesktopApp(): boolean {
  return isTauri()
}
