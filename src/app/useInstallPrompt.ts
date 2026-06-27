import { useCallback, useEffect, useRef, useState } from 'react'

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  )
}

export function useInstallPrompt() {
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null)
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(isStandaloneDisplay)

  useEffect(() => {
    function onBeforeInstall(event: BeforeInstallPromptEvent) {
      event.preventDefault()
      deferredRef.current = event
      setCanInstall(true)
    }

    function onInstalled() {
      deferredRef.current = null
      setCanInstall(false)
      setIsInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const promptInstall = useCallback(async (): Promise<boolean> => {
    const event = deferredRef.current
    if (!event) return false

    await event.prompt()
    const choice = await event.userChoice
    if (choice.outcome === 'accepted') {
      deferredRef.current = null
      setCanInstall(false)
      setIsInstalled(true)
      return true
    }
    return false
  }, [])

  return { canInstall, isInstalled, promptInstall }
}
