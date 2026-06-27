import { invoke } from '@tauri-apps/api/core'
import { listen, TauriEvent } from '@tauri-apps/api/event'
import { isTauri } from './desktop'

const PENDING_RETRY_MS = [0, 50, 150, 400, 1000]

async function readPendingOpenFiles(): Promise<string[]> {
  return invoke<string[]>('pending_open_files')
}

async function clearPendingOpenFiles(): Promise<void> {
  await invoke('clear_pending_open_files')
}

function uniquePaths(paths: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const path of paths) {
    if (!path || seen.has(path)) continue
    seen.add(path)
    out.push(path)
  }
  return out
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export type TauriOpenFilesBootstrap = {
  dispose: () => void
}

/**
 * Resolves when cold-start file opens are known (macOS Open With may arrive late).
 * Registers the runtime listener before polling pending paths.
 */
export async function bootstrapTauriFileOpens(
  onOpen: (paths: string[]) => void,
  onBootstrapComplete?: (openedAny: boolean) => void,
): Promise<TauriOpenFilesBootstrap> {
  let openedAny = false
  let bootstrapSettled = false

  const openFromBootstrap = (paths: string[]) => {
    const unique = uniquePaths(paths)
    if (unique.length === 0 || bootstrapSettled) return
    bootstrapSettled = true
    openedAny = true
    onOpen(unique)
    void clearPendingOpenFiles()
  }

  const openFromRuntime = (paths: string[]) => {
    const unique = uniquePaths(paths)
    if (unique.length === 0) return
    openedAny = true
    onOpen(unique)
    void clearPendingOpenFiles()
  }

  const unlisten = await listen<string[]>('open-files', (event) => {
    openFromRuntime(event.payload)
  })

  const unlistenFocus = await listen(TauriEvent.WINDOW_FOCUS, () => {
    void (async () => {
      const pending = uniquePaths(await readPendingOpenFiles())
      if (pending.length === 0) return
      openFromRuntime(pending)
    })()
  })

  for (const ms of PENDING_RETRY_MS) {
    if (bootstrapSettled) break
    if (ms > 0) await delay(ms)
    const pending = uniquePaths(await readPendingOpenFiles())
    if (pending.length > 0) {
      openFromBootstrap(pending)
      break
    }
  }

  onBootstrapComplete?.(openedAny)

  return {
    dispose: () => {
      unlisten()
      unlistenFocus()
    },
  }
}

export function isTauriDesktop(): boolean {
  return isTauri()
}
