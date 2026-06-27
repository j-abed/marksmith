/** No-op stub used when the PWA plugin is not loaded (Tauri desktop builds). */
export function registerSW() {
  return () => {}
}
