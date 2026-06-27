export const SPLIT_RATIO_MIN = 0.22
export const SPLIT_RATIO_MAX = 0.78
export const SPLIT_RATIO_DEFAULT = 0.5
export const SPLIT_RATIO_STORAGE_KEY = 'marksmith:split-ratio'

export function clampSplitRatio(ratio: number): number {
  if (!Number.isFinite(ratio)) return SPLIT_RATIO_DEFAULT
  return Math.min(SPLIT_RATIO_MAX, Math.max(SPLIT_RATIO_MIN, ratio))
}

export function loadSplitRatio(): number {
  try {
    const raw = localStorage.getItem(SPLIT_RATIO_STORAGE_KEY)
    if (!raw) return SPLIT_RATIO_DEFAULT
    return clampSplitRatio(Number.parseFloat(raw))
  } catch {
    return SPLIT_RATIO_DEFAULT
  }
}
