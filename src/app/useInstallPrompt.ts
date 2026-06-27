import { useCallback, useEffect, useRef, useState } from 'react'
import { isChromiumBrowser } from './installAppHelp'

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

  /** Chrome/Edge — View menu when not already installed. */
  const showInstallInMenu = !isInstalled && isChromiumBrowser()

  /** Safari, Firefox, etc. — subtle footer hint. */
  const showInstallInFooter = !isInstalled && !isChromiumBrowser()

  return {
    canInstall,
    isInstalled,
    promptInstall,
    showInstallInMenu,
    showInstallInFooter,
  }
}
