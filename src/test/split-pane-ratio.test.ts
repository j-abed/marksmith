import { describe, expect, it } from 'vitest'
import {
  clampSplitRatio,
  SPLIT_RATIO_DEFAULT,
  SPLIT_RATIO_MAX,
  SPLIT_RATIO_MIN,
} from '../editor/splitPaneRatio'

describe('splitPaneRatio', () => {
  it('clamps values to allowed range', () => {
    expect(clampSplitRatio(0.5)).toBe(0.5)
    expect(clampSplitRatio(0.1)).toBe(SPLIT_RATIO_MIN)
    expect(clampSplitRatio(0.9)).toBe(SPLIT_RATIO_MAX)
    expect(clampSplitRatio(Number.NaN)).toBe(SPLIT_RATIO_DEFAULT)
  })
})
