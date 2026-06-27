import { describe, expect, it } from 'vitest'
import { formatSaveStatusLabel } from '../ui/saveStatusLabel'

describe('formatSaveStatusLabel', () => {
  it('labels unlinked drafts distinctly from disk saves', () => {
    expect(formatSaveStatusLabel('saved', false)).toBe('Draft saved')
    expect(formatSaveStatusLabel('saving', false)).toBe('Saving draft…')
    expect(formatSaveStatusLabel('saved', true)).toBe('Saved')
    expect(formatSaveStatusLabel('saved', true, 'notes.md')).toBe(
      'Saved to notes.md',
    )
  })

  it('labels unsaved edits', () => {
    expect(formatSaveStatusLabel('unsaved', false)).toBe('Unsaved')
  })
})
