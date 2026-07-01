import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test, expect, type Page } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturePath = path.join(__dirname, 'fixtures', 'open-me.md')
const yamlFixturePath = path.join(__dirname, 'fixtures', 'yaml-brief.md')

async function gotoFresh(page: Page) {
  await page.addInitScript(() => {
    localStorage.removeItem('marksmith:draft')
    localStorage.removeItem('marksmith:doc-modes')
    localStorage.removeItem('marksmith:doc-sidebar')
    localStorage.removeItem('marksmith:recent')
  })
  await page.goto('/')
  await expect(page.getByLabel('Document title')).toBeVisible({ timeout: 15_000 })
}

async function selectMode(page: Page, mode: string) {
  await page.getByTestId('mode-menu').click()
  await page.getByTestId(`mode-${mode}`).click()
}

test.describe('document tabs', () => {
  test('adds, switches, and closes tabs', async ({ page }) => {
    await gotoFresh(page)

    await expect(page.getByTestId('document-tab-bar')).toBeVisible()
    await expect(page.getByRole('tab')).toHaveCount(1)

    await page.getByTestId('document-tab-new').click()
    await expect(page.getByRole('tab')).toHaveCount(2)

    await page.getByRole('tab').nth(1).click()
    await expect(page.locator('.cm-content')).not.toContainText('Welcome to Marksmith')

    await page.getByRole('tab').nth(0).click()
    await expect(page.locator('.cm-content')).toContainText('Welcome to Marksmith')

    await page.getByRole('tab').nth(1).click()
    await page.locator('.document-tab').nth(1).getByLabel('Close Untitled').click()
    await expect(page.getByRole('tab')).toHaveCount(1)
    await expect(page.locator('.cm-content')).toContainText('Welcome to Marksmith')
  })
})

test.describe('zen mode', () => {
  test('hides chrome and exits with Escape', async ({ page }) => {
    await gotoFresh(page)

    await page.getByRole('button', { name: 'Enter zen mode' }).click()
    await expect(page.locator('.top-bar')).toHaveCount(0)
    await expect(page.locator('.status-bar')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Exit zen mode' })).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.locator('.top-bar')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Exit zen mode' })).toHaveCount(0)
  })
})

test.describe('file open', () => {
  test('loads markdown via file input fallback', async ({ page }) => {
    await gotoFresh(page)

    await page.getByTestId('file-open-input').setInputFiles(fixturePath)

    await expect(page.getByLabel('Document title')).toHaveValue('open-me')
    await expect(page.locator('.cm-content')).toContainText('Loaded from a file fixture')
    await expect(page.getByRole('status')).toContainText('Opened open-me')
  })
})

test.describe('drag and drop', () => {
  test('opens dropped markdown file', async ({ page }) => {
    await gotoFresh(page)

    await page.evaluate(async () => {
      const markdown = '# Dropped doc\n\nFrom drag and drop.'
      const file = new File([markdown], 'dropped.md', { type: 'text/markdown' })
      const dt = new DataTransfer()
      dt.items.add(file)
      const shell = document.querySelector('.app-shell')
      if (!shell) throw new Error('app shell missing')
      shell.dispatchEvent(
        new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }),
      )
    })

    await expect(page.getByLabel('Document title')).toHaveValue('dropped')
    await expect(page.locator('.cm-content')).toContainText('From drag and drop')
  })
})

test.describe('split resize', () => {
  test('dragging divider changes pane widths', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'marksmith:draft',
        JSON.stringify({
          document: {
            id: 'resize-test',
            title: 'Resize',
            markdown: '# Resize\n\n' + 'word '.repeat(400),
            dirty: false,
            updatedAt: new Date().toISOString(),
          },
          mode: 'split',
          theme: 'light',
        }),
      )
    })
    await page.goto('/')
    await expect(page.getByTestId('split-editor')).toBeVisible({ timeout: 15_000 })

    const panes = page.locator('.split-editor__panes')
    const divider = page.locator('.split-editor__divider')
    const box = await panes.boundingBox()
    expect(box).not.toBeNull()
    if (!box) return

    const before = await page.locator('.split-editor__pane--raw').evaluate((el) =>
      el.getBoundingClientRect().width,
    )

    const startX = box.x + box.width * 0.5
    const endX = box.x + box.width * 0.68
    const y = box.y + box.height / 2

    await divider.dispatchEvent('pointerdown', {
      pointerId: 1,
      clientX: startX,
      clientY: y,
      button: 0,
      buttons: 1,
      isPrimary: true,
    })
    await divider.dispatchEvent('pointermove', {
      pointerId: 1,
      clientX: endX,
      clientY: y,
      button: 0,
      buttons: 1,
      isPrimary: true,
    })
    await divider.dispatchEvent('pointerup', {
      pointerId: 1,
      clientX: endX,
      clientY: y,
      button: 0,
      buttons: 0,
      isPrimary: true,
    })

    await page.waitForTimeout(100)

    const after = await page.locator('.split-editor__pane--raw').evaluate((el) =>
      el.getBoundingClientRect().width,
    )

    expect(after).toBeGreaterThan(before + 20)
  })
})

test.describe('file menu', () => {
  test('new document resets editor', async ({ page }) => {
    await gotoFresh(page)

    await page.getByRole('button', { name: /^File/ }).click()
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible()
    await menu.getByRole('menuitem').filter({ hasText: 'New document' }).click()

    await expect(page.getByLabel('Document title')).toHaveValue('Untitled')
    await expect(page.locator('.cm-content')).toHaveText('')
    await expect(page.getByRole('status')).toContainText('New document')
  })

  test('save is disabled until a file is linked', async ({ page }) => {
    await gotoFresh(page)

    await page.getByRole('button', { name: /^File/ }).click()
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible()
    const saveItem = menu.getByRole('menuitem').filter({ hasText: /^Save/ }).first()
    await expect(saveItem).toBeDisabled()
  })

  test('restores last editor mode per document', async ({ page }) => {
    await gotoFresh(page)

    await page.getByTestId('file-open-input').setInputFiles(fixturePath)
    await expect(page.getByLabel('Document title')).toHaveValue('open-me')

    await selectMode(page, 'compare')
    await expect(page.getByTestId('compare-editor')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByTestId('mode-menu')).toContainText('Compare')

    await page.getByRole('button', { name: /^File/ }).click()
    await page.getByRole('menuitem').filter({ hasText: 'New document' }).click()
    await expect(page.getByTestId('mode-menu')).toContainText('Raw')

    await page.getByRole('button', { name: /^File/ }).click()
    await page
      .getByRole('menuitem')
      .filter({ hasText: 'open-me.md' })
      .click()

    await expect(page.getByTestId('compare-editor')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByTestId('mode-menu')).toContainText('Compare')
  })
})

test.describe('keyboard shortcuts', () => {
  test('creates a new document with Meta+n', async ({ page }) => {
    await gotoFresh(page)

    await page.locator('.cm-content').click()
    await page.keyboard.press('Meta+n')

    await expect(page.getByLabel('Document title')).toHaveValue('Untitled')
    await expect(page.locator('.cm-content')).toHaveText('')
    await expect(page.getByRole('status')).toContainText('New document')
  })

  test('opens replace panel from Edit menu', async ({ page }) => {
    await gotoFresh(page)

    await page.getByRole('button', { name: 'Edit', exact: true }).click()
    await page.getByRole('menuitem').filter({ hasText: 'Replace' }).click()

    await expect(page.locator('.cm-panel.cm-search input[name="replace"]')).toBeVisible({
      timeout: 5000,
    })
  })
})

test.describe('outline sidebar', () => {
  test('shows headings and toggles from View menu', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'marksmith:draft',
        JSON.stringify({
          document: {
            id: 'outline-test',
            title: 'Outline Test',
            markdown: '# Intro\n\n## Section A\n\n### Detail\n\n## Section B',
            dirty: false,
            updatedAt: new Date().toISOString(),
          },
          mode: 'raw',
          theme: 'light',
        }),
      )
    })
    await page.goto('/')

    await page.getByRole('button', { name: /^View/ }).click()
    await page.getByRole('menuitem', { name: /Show outline/i }).click()

    const sidebar = page.locator('.document-sidebar')
    await expect(sidebar).toBeVisible()
    await expect(sidebar.getByRole('button', { name: 'Intro' })).toBeVisible()
    await expect(sidebar.getByRole('button', { name: 'Section A' })).toBeVisible()
    await expect(sidebar.getByRole('button', { name: 'Detail' })).toBeVisible()
  })
})

test.describe('frontmatter panel', () => {
  test('edits yaml header from View menu', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'marksmith:draft',
        JSON.stringify({
          document: {
            id: 'frontmatter-test',
            title: 'Project Brief',
            markdown: '# Project Brief\n\n## Objective\n\nWrite docs.',
            dirty: false,
            updatedAt: new Date().toISOString(),
          },
          mode: 'raw',
          theme: 'dark',
        }),
      )
    })
    await page.goto('/')
    await expect(page.getByLabel('Document title')).toBeVisible({ timeout: 15_000 })

    await page.getByRole('button', { name: /^View/ }).click()
    await page.getByRole('menuitem', { name: /Show frontmatter/i }).click()

    const panel = page.getByTestId('frontmatter-panel')
    await expect(panel).toBeVisible()
    await panel.getByTestId('frontmatter-title').fill('Launch Brief')
    await panel.getByTestId('frontmatter-title').blur()
    await panel.getByTestId('frontmatter-date').fill('2026-06-26')
    await panel.getByTestId('frontmatter-date').blur()
    await panel.getByTestId('frontmatter-tags').fill('local-first, docs')
    await panel.getByTestId('frontmatter-tags').blur()

    await expect(page.locator('.cm-content')).toContainText('title: Launch Brief')
    await expect(page.locator('.cm-content')).toContainText('date: 2026-06-26')
    await expect(page.locator('.cm-content')).toContainText('- docs')
  })
})

test.describe('frontmatter metadata UX', () => {
  test('uses yaml title when opening a file', async ({ page }) => {
    await gotoFresh(page)

    await page.getByTestId('file-open-input').setInputFiles(yamlFixturePath)

    await expect(page.getByLabel('Document title')).toHaveValue('Project Brief')
    await expect(page.locator('.cm-content')).toContainText('title: Project Brief')
    await expect(page.getByRole('status')).toContainText('Opened yaml-brief')
  })

  test('recent list notes yaml metadata', async ({ page }) => {
    await gotoFresh(page)

    await page.getByTestId('file-open-input').setInputFiles(yamlFixturePath)
    await expect(page.getByLabel('Document title')).toHaveValue('Project Brief')

    await page.getByRole('button', { name: /^File/ }).click()
    const recentItem = page
      .getByRole('menuitem')
      .filter({ hasText: 'yaml-brief.md' })
    await expect(recentItem).toBeVisible()
    await expect(recentItem.locator('.top-bar-menu__item-desc')).toContainText(
      'YAML metadata',
    )
  })

  test('restores sidebar tab when reopening from recent', async ({ page }) => {
    await gotoFresh(page)

    await page.getByTestId('file-open-input').setInputFiles(yamlFixturePath)
    await expect(page.getByLabel('Document title')).toHaveValue('Project Brief')

    const sidebar = page.locator('.document-sidebar')
    await expect(sidebar).toBeVisible()
    await expect(page.getByTestId('frontmatter-panel')).toBeVisible()

    await sidebar.getByRole('tab', { name: 'Outline' }).click()
    await expect(sidebar.getByRole('tab', { name: 'Outline' })).toHaveAttribute(
      'aria-selected',
      'true',
    )

    await page.getByRole('button', { name: /^File/ }).click()
    await page.getByRole('menuitem').filter({ hasText: 'New document' }).click()
    await expect(page.getByLabel('Document title')).toHaveValue('Untitled')
    await expect(sidebar).toHaveCount(0)

    await page.getByRole('button', { name: /^File/ }).click()
    await page.getByRole('menuitem').filter({ hasText: 'yaml-brief.md' }).click()

    await expect(page.getByLabel('Document title')).toHaveValue('Project Brief')
    await expect(sidebar).toBeVisible()
    await expect(sidebar.getByRole('tab', { name: 'Outline' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(sidebar.getByRole('button', { name: 'Body' })).toBeVisible()
    await expect(page.getByTestId('frontmatter-panel')).toHaveCount(0)
  })
})

test.describe('keyboard shortcuts help', () => {
  test('opens from View menu', async ({ page }) => {
    await gotoFresh(page)

    await page.getByRole('button', { name: /^View/ }).click()
    await page.getByRole('menuitem').filter({ hasText: 'Keyboard shortcuts' }).click()

    await expect(page.getByTestId('keyboard-shortcuts-dialog')).toBeVisible()
    await expect(page.getByText('Find…')).toBeVisible()
    await expect(page.getByText('⌘F')).toBeVisible()
  })

  test('opens with Meta+/', async ({ page }) => {
    await gotoFresh(page)

    await page.keyboard.press('Meta+/')
    await expect(page.getByTestId('keyboard-shortcuts-dialog')).toBeVisible()
  })
})

test.describe('install app', () => {
  test('shows in View menu on Chrome', async ({ page }) => {
    await gotoFresh(page)

    await page.getByRole('button', { name: /^View/ }).click()
    await expect(
      page.getByRole('menuitem').filter({ hasText: 'Install app' }),
    ).toBeVisible()
  })
})

test.describe('confirm dialog', () => {
  test('blocks new document until discard is confirmed', async ({ page }) => {
    await gotoFresh(page)

    await page.locator('.cm-content').click()
    await page.keyboard.press('Meta+a')
    await page.keyboard.insertText('# Changed content')
    await expect(page.locator('.status-bar__save--unsaved, .status-bar__save--saving')).toBeVisible()

    await page.getByRole('button', { name: /^File/ }).click()
    await page.getByRole('menuitem').filter({ hasText: 'New document' }).click()

    await expect(page.getByRole('alertdialog')).toBeVisible()
    await page.getByRole('button', { name: 'Keep editing' }).click()
    await expect(page.locator('.cm-content')).toContainText('Changed content')

    await page.getByRole('button', { name: /^File/ }).click()
    await page.getByRole('menuitem').filter({ hasText: 'New document' }).click()
    await page.getByRole('button', { name: 'Discard changes' }).click()

    await expect(page.getByLabel('Document title')).toHaveValue('Untitled')
    await expect(page.locator('.cm-content')).toHaveText('')
  })
})

test.describe('html import', () => {
  test('converts html files on open', async ({ page }) => {
    await gotoFresh(page)

    const htmlPath = path.join(__dirname, 'fixtures', 'open-me.html')
    await page.getByTestId('file-open-input').setInputFiles(htmlPath)

    await expect(page.getByLabel('Document title')).toHaveValue('open-me')
    await expect(page.locator('.cm-content')).toContainText('HTML from an assistant')
    await expect(page.getByRole('status')).toContainText('converted from HTML')
  })

  test('converts pasted html fragments', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await gotoFresh(page)

    await page.locator('.cm-content').click()

    await page.evaluate(async () => {
      const html = '<p>Pasted <strong>HTML</strong></p><ul><li>Item</li></ul>'
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob(['fallback'], { type: 'text/plain' }),
        }),
      ])
    })

    await page.getByRole('button', { name: /^Edit/ }).click()
    await page.getByRole('menuitem').filter({ hasText: 'Paste' }).click()

    await expect(page.locator('.cm-content')).toContainText('HTML')
    await expect(page.locator('.cm-content')).toContainText('Item')
    await expect(page.getByRole('status')).toContainText('converted from HTML')
  })
})

test.describe('lazy-loaded modes', () => {
  test('loads preview mode on demand', async ({ page }) => {
    await gotoFresh(page)

    await selectMode(page, 'preview')
    await expect(page.getByTestId('preview-pane')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('.preview-content')).toContainText('Welcome to Marksmith')
  })

  test('loads hybrid mode on demand', async ({ page }) => {
    await gotoFresh(page)

    await selectMode(page, 'hybrid')
    await expect(page.locator('.hybrid-editor .cm-content')).toBeVisible({ timeout: 15_000 })
  })

  test('loads html mode on demand', async ({ page }) => {
    await gotoFresh(page)

    await selectMode(page, 'html')
    await expect(page.getByTestId('html-editor')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('.html-source-editor .cm-content')).toContainText('<')
  })

  test('loads compare mode on demand', async ({ page }) => {
    await gotoFresh(page)

    await selectMode(page, 'compare')
    await expect(page.getByTestId('compare-editor')).toBeVisible({ timeout: 15_000 })
    const compare = page.getByTestId('compare-editor')
    await expect(compare.getByText('Markdown', { exact: true })).toBeVisible()
    await expect(compare.getByText('HTML', { exact: true })).toBeVisible()
    await expect(compare.getByLabel('Sync scroll')).toBeVisible()
    await expect(page.getByTestId('compare-diff-hint')).toContainText('matches Markdown render')
  })

  test('compare mode highlights html diff', async ({ page }) => {
    await gotoFresh(page)
    await selectMode(page, 'compare')
    await expect(page.getByTestId('compare-editor')).toBeVisible({ timeout: 15_000 })

    const htmlPane = page.locator('.compare-editor .html-source-editor .cm-content')
    await htmlPane.click()
    await page.keyboard.press('Meta+a')
    await page.keyboard.insertText('<p>Custom HTML line</p>')

    await expect(page.getByTestId('compare-diff-hint')).toHaveText(/differ/i, {
      timeout: 5000,
    })
    await expect(
      page.locator('.compare-diff-line, .compare-diff-word').first(),
    ).toBeVisible({ timeout: 5000 })
  })

  test('compare auto-sync toggle controls html round-trip', async ({ page }) => {
    await gotoFresh(page)
    await selectMode(page, 'compare')
    await expect(page.getByTestId('compare-editor')).toBeVisible({ timeout: 15_000 })

    const autoSync = page.getByTestId('compare-auto-sync')
    await expect(autoSync).not.toBeChecked()

    const htmlPane = page.locator('.compare-editor .html-source-editor .cm-content')
    await htmlPane.click()
    await page.keyboard.press('Meta+a')
    await page.keyboard.insertText('<p>Drift check</p>')

    await expect(page.getByTestId('compare-diff-hint')).toHaveText(/differ/i, {
      timeout: 3000,
    })

    await autoSync.check()
    await htmlPane.click()
    await page.keyboard.type(' ')
    await expect(page.getByTestId('compare-diff-hint')).toContainText(
      'matches Markdown render',
      { timeout: 8000 },
    )
  })

  test('compare mode sync actions update panes', async ({ page }) => {
    await gotoFresh(page)
    await selectMode(page, 'compare')
    await expect(page.getByTestId('compare-editor')).toBeVisible({ timeout: 15_000 })

    const htmlPane = page.locator('.compare-editor .html-source-editor .cm-content')
    await htmlPane.click()
    await page.keyboard.press('Meta+a')
    await page.keyboard.insertText('<p>Custom HTML</p>')

    await expect(page.getByTestId('compare-sync-html')).toBeEnabled({ timeout: 5000 })
    await page.getByTestId('compare-sync-html').click()
    await expect(page.getByRole('status')).toContainText('HTML synced from Markdown')
    await expect(htmlPane).not.toContainText('Custom HTML')

    await htmlPane.click()
    await page.keyboard.press('Meta+a')
    await page.keyboard.insertText('<p>Apply me</p>')

    await expect(page.getByTestId('compare-apply-html')).toBeEnabled({ timeout: 5000 })
    await page.getByTestId('compare-apply-html').click()
    await expect(page.getByRole('status')).toContainText('Markdown updated from HTML')
    await expect(page.locator('.compare-editor .raw-editor .cm-content')).toContainText('Apply me')
  })

  test('compare mode syncs scroll between panes', async ({ page }) => {
    await gotoFresh(page)
    await selectMode(page, 'compare')
    await expect(page.getByTestId('compare-editor')).toBeVisible({ timeout: 15_000 })

    const synced = await page.evaluate(() => {
      const panes = document.querySelectorAll('.compare-editor .cm-scroller')
      if (panes.length < 2) return false
      const mdScroller = panes[0] as HTMLElement
      const htmlScroller = panes[1] as HTMLElement
      const max = mdScroller.scrollHeight - mdScroller.clientHeight
      if (max <= 0) return false
      mdScroller.scrollTop = max * 0.5
      mdScroller.dispatchEvent(new Event('scroll', { bubbles: true }))
      return htmlScroller.scrollTop > 0
    })

    expect(synced).toBe(true)
  })
})

test.describe('export menu', () => {
  test('lists all export formats', async ({ page }) => {
    await gotoFresh(page)

    await page.getByRole('button', { name: 'Export' }).click()
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible()
    await expect(menu.getByRole('menuitem', { name: 'Markdown Canonical source' })).toBeVisible()
    await expect(menu.getByRole('menuitem', { name: 'HTML Sanitized standalone' })).toBeVisible()
    await expect(menu.getByRole('menuitem', { name: 'Plain text Markdown syntax' })).toBeVisible()
    await expect(menu.getByRole('menuitem', { name: 'JSON Title and content' })).toBeVisible()
  })
})
