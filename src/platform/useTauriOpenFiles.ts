import { useEffect, useRef } from 'react'
import { bootstrapTauriFileOpens, isTauriDesktop } from './tauriFileOpens'

export function useTauriOpenFiles(
  onOpen: (paths: string[]) => void,
  onBootstrapComplete?: (openedAny: boolean) => void,
): void {
  const onOpenRef = useRef(onOpen)
  const onBootstrapCompleteRef = useRef(onBootstrapComplete)
  onOpenRef.current = onOpen
  onBootstrapCompleteRef.current = onBootstrapComplete

  useEffect(() => {
    if (!isTauriDesktop()) return

    let bootstrap: { dispose: () => void } | undefined

    void bootstrapTauriFileOpens(
      (paths) => {
        onOpenRef.current(paths)
      },
      (openedAny) => {
        onBootstrapCompleteRef.current?.(openedAny)
      },
    ).then((handle) => {
      bootstrap = handle
    })

    return () => {
      bootstrap?.dispose()
    }
  }, [])
}
