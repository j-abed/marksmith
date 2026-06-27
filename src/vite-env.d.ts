/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly TAURI_ENV_PLATFORM?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent
}
