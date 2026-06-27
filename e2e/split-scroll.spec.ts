import { test, expect } from '@playwright/test'

const LONG_MARKDOWN = `# Section One

${Array.from({ length: 40 }, (_, i) => `Paragraph ${i + 1} with enough text to make the document scroll comfortably in split view.`).join('\n\n')}

## Section Two

${Array.from({ length: 40 }, (_, i) => `More content ${i + 1} for preview sync testing across both panes.`).join('\n\n')}

## Section Three

${Array.from({ length: 40 }, (_, i) => `Final block ${i + 1} near the end of the document.`).join('\n\n')}
`

async function seedDocument(page: import('@playwright/test').Page) {
  await page.addInitScript((markdown) => {
    localStorage.setItem(
      'marksmith:draft',
      JSON.stringify({
        document: {
          id: 'test-doc',
          title: 'Scroll Test',
          markdown,
          dirty: false,
          updatedAt: new Date().toISOString(),
        },
        mode: 'split',
        theme: 'light',
      }),
    )
  }, LONG_MARKDOWN)
}

async function openSplit(page: import('@playwright/test').Page) {
  await seedDocument(page)
  await page.goto('/')
  await expect(page.getByTestId('split-editor')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByTestId('preview-pane')).toBeVisible()
  await page.waitForFunction(() => {
    const preview = document.querySelector('[data-testid="preview-pane"]')
    return preview && preview.scrollHeight > preview.clientHeight + 100
  })
}

function scrollRatio(el: { scrollTop: number; scrollHeight: number; clientHeight: number }) {
  const max = Math.max(0, el.scrollHeight - el.clientHeight)
  if (max <= 0) return 0
  return el.scrollTop / max
}

test.describe('split scroll sync', () => {
  test('editor scroll follows through document without jumping back', async ({
    page,
  }) => {
    await openSplit(page)

    const editor = page.locator('.cm-scroller')
    const preview = page.getByTestId('preview-pane')

    const targets = [0.25, 0.5, 0.75]

    for (const target of targets) {
      await editor.evaluate((el, ratio) => {
        const max = Math.max(0, el.scrollHeight - el.clientHeight)
        el.scrollTop = max * ratio
      }, target)

      await page.waitForFunction(
        (expected) => {
          const ed = document.querySelector('.cm-scroller') as HTMLElement | null
          const pr = document.querySelector(
            '[data-testid="preview-pane"]',
          ) as HTMLElement | null
          if (!ed || !pr) return false
          const maxEd = Math.max(0, ed.scrollHeight - ed.clientHeight)
          const maxPr = Math.max(0, pr.scrollHeight - pr.clientHeight)
          const editor = maxEd > 0 ? ed.scrollTop / maxEd : 0
          const preview = maxPr > 0 ? pr.scrollTop / maxPr : 0
          return (
            Math.abs(editor - expected) < 0.11 &&
            Math.abs(preview - expected) < 0.11
          )
        },
        target,
        { timeout: 3000 },
      )

      const ratios = await page.evaluate(() => {
        const ed = document.querySelector('.cm-scroller') as HTMLElement
        const pr = document.querySelector(
          '[data-testid="preview-pane"]',
        ) as HTMLElement
        const maxEd = Math.max(0, ed.scrollHeight - ed.clientHeight)
        const maxPr = Math.max(0, pr.scrollHeight - pr.clientHeight)
        return {
          editor: maxEd > 0 ? ed.scrollTop / maxEd : 0,
          preview: maxPr > 0 ? pr.scrollTop / maxPr : 0,
        }
      })

      expect(Math.abs(ratios.editor - target)).toBeLessThan(0.11)
      expect(Math.abs(ratios.preview - target)).toBeLessThan(0.11)

      // Position should remain stable — no significant jump back toward top
      await page.waitForTimeout(300)
      const after = await page.evaluate(() => {
        const ed = document.querySelector('.cm-scroller') as HTMLElement
        const pr = document.querySelector(
          '[data-testid="preview-pane"]',
        ) as HTMLElement
        const maxEd = Math.max(0, ed.scrollHeight - ed.clientHeight)
        const maxPr = Math.max(0, pr.scrollHeight - pr.clientHeight)
        return {
          editor: maxEd > 0 ? ed.scrollTop / maxEd : 0,
          preview: maxPr > 0 ? pr.scrollTop / maxPr : 0,
          editorPx: ed.scrollTop,
          previewPx: pr.scrollTop,
        }
      })

      expect(after.editor).toBeGreaterThanOrEqual(ratios.editor - 0.05)
      expect(after.preview).toBeGreaterThanOrEqual(ratios.preview - 0.05)
      if (target > 0.2) {
        expect(after.editor).toBeGreaterThan(0.15)
        expect(after.preview).toBeGreaterThan(0.15)
      }
    }
  })

  test('preview scroll drives editor without jumping back', async ({ page }) => {
    await openSplit(page)

    const preview = page.getByTestId('preview-pane')
    const targets = [0.3, 0.6, 0.9]

    for (const target of targets) {
      await preview.evaluate((el, ratio) => {
        const max = Math.max(0, el.scrollHeight - el.clientHeight)
        el.scrollTop = max * ratio
      }, target)

      await page.waitForFunction(
        (expected) => {
          const ed = document.querySelector('.cm-scroller') as HTMLElement | null
          const pr = document.querySelector(
            '[data-testid="preview-pane"]',
          ) as HTMLElement | null
          if (!ed || !pr) return false
          const maxEd = Math.max(0, ed.scrollHeight - ed.clientHeight)
          const maxPr = Math.max(0, pr.scrollHeight - pr.clientHeight)
          const editor = maxEd > 0 ? ed.scrollTop / maxEd : 0
          const preview = maxPr > 0 ? pr.scrollTop / maxPr : 0
          return (
            Math.abs(preview - expected) < 0.11 &&
            Math.abs(editor - expected) < 0.11
          )
        },
        target,
        { timeout: 3000 },
      )

      const ratios = await page.evaluate(() => {
        const ed = document.querySelector('.cm-scroller') as HTMLElement
        const pr = document.querySelector(
          '[data-testid="preview-pane"]',
        ) as HTMLElement
        const maxEd = Math.max(0, ed.scrollHeight - ed.clientHeight)
        const maxPr = Math.max(0, pr.scrollHeight - pr.clientHeight)
        return {
          editor: maxEd > 0 ? ed.scrollTop / maxEd : 0,
          preview: maxPr > 0 ? pr.scrollTop / maxPr : 0,
        }
      })

      expect(Math.abs(ratios.preview - target)).toBeLessThan(0.11)
      expect(Math.abs(ratios.editor - target)).toBeLessThan(0.11)

      await page.waitForTimeout(300)
      const after = await page.evaluate(() => {
        const ed = document.querySelector('.cm-scroller') as HTMLElement
        const pr = document.querySelector(
          '[data-testid="preview-pane"]',
        ) as HTMLElement
        const maxEd = Math.max(0, ed.scrollHeight - ed.clientHeight)
        const maxPr = Math.max(0, pr.scrollHeight - pr.clientHeight)
        return {
          editor: maxEd > 0 ? ed.scrollTop / maxEd : 0,
          preview: maxPr > 0 ? pr.scrollTop / maxPr : 0,
        }
      })

      expect(after.editor).toBeGreaterThanOrEqual(ratios.editor - 0.05)
      expect(after.preview).toBeGreaterThanOrEqual(ratios.preview - 0.05)
      if (target > 0.2) {
        expect(after.editor).toBeGreaterThan(0.15)
        expect(after.preview).toBeGreaterThan(0.15)
      }
    }
  })

  test('sync toggle disables linked scrolling', async ({ page }) => {
    await openSplit(page)

    await page.getByLabel('Sync scroll').uncheck()

    await page.locator('.cm-scroller').evaluate((el) => {
      const max = Math.max(0, el.scrollHeight - el.clientHeight)
      el.scrollTop = max * 0.7
      el.dispatchEvent(new Event('scroll', { bubbles: true }))
    })

    await page.waitForTimeout(150)

    const previewRatio = await page.getByTestId('preview-pane').evaluate((el) => {
      const max = Math.max(0, el.scrollHeight - el.clientHeight)
      return max > 0 ? el.scrollTop / max : 0
    })

    expect(previewRatio).toBeLessThan(0.1)
  })
})
