import { chromium } from '@playwright/test'
import { mkdir, readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const assets = join(root, 'docs', 'assets')
const showcaseMarkdown = await readFile(
  join(root, 'docs', 'showcase-content.md'),
  'utf8',
)
const showcaseTitle = 'Project Brief'

async function waitForServer(url, timeout = 60_000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`Server not ready at ${url}`)
}

async function seedShowcaseDraft(page, theme) {
  await page.addInitScript(
    ({ markdown, title, theme }) => {
      const now = new Date().toISOString()
      localStorage.setItem(
        'marksmith:draft',
        JSON.stringify({
          document: {
            id: 'showcase-doc',
            title,
            markdown,
            dirty: false,
            updatedAt: now,
          },
          mode: 'split',
          theme,
        }),
      )
      localStorage.setItem('marksmith:theme', theme)
      localStorage.removeItem('marksmith:doc-modes')
      localStorage.removeItem('marksmith:doc-sidebar')
      localStorage.removeItem('marksmith:recent')
    },
    { markdown: showcaseMarkdown, title: showcaseTitle, theme },
  )
}

async function setAppTheme(page, theme) {
  await page.evaluate((next) => {
    document.documentElement.dataset.theme = next
    localStorage.setItem('marksmith:theme', next)
  }, theme)
  await page.waitForTimeout(350)
}

async function selectMode(page, mode) {
  await page.getByTestId('mode-menu').click()
  await page.getByTestId(`mode-${mode}`).click()
}

async function closeSidebarIfOpen(page) {
  const closeBtn = page.locator('.document-sidebar__close')
  if (await closeBtn.isVisible()) {
    await closeBtn.click()
    await page.waitForTimeout(300)
  }
}

async function captureFrontmatter(page, theme) {
  const suffix = theme === 'dark' ? '' : '-light'

  await page.waitForSelector('.document-sidebar', { timeout: 10_000 })
  await page.waitForSelector('[data-testid="frontmatter-panel"]', {
    timeout: 10_000,
  })
  await page.waitForTimeout(500)
  await page.locator('.app-shell').screenshot({
    path: join(assets, `app-frontmatter${suffix}.png`),
  })
}

async function captureModes(page, theme) {
  const suffix = theme === 'dark' ? '' : '-light'

  await closeSidebarIfOpen(page)

  await selectMode(page, 'split')
  await page.waitForTimeout(600)
  await page.locator('.app-shell').screenshot({
    path: join(assets, `app-split${suffix}.png`),
  })

  const modes = [
    { id: 'raw', file: `app-raw${suffix}.png` },
    { id: 'preview', file: `app-preview${suffix}.png` },
    { id: 'hybrid', file: `app-hybrid${suffix}.png` },
  ]

  for (const mode of modes) {
    await selectMode(page, mode.id)
    await page.waitForTimeout(500)
    await page.locator('.app-shell').screenshot({
      path: join(assets, mode.file),
    })
  }

  await selectMode(page, 'split')
  await page.waitForTimeout(300)
  const scroller = page.locator('.cm-scroller')
  await scroller.evaluate((el) => {
    const max = Math.max(0, el.scrollHeight - el.clientHeight)
    el.scrollTop = max * 0.35
    el.dispatchEvent(new Event('scroll', { bubbles: true }))
  })
  await page.waitForTimeout(400)
  await page.locator('.app-shell').screenshot({
    path: join(assets, `app-split-scrolled${suffix}.png`),
  })
}

async function captureHtml(page, theme) {
  const suffix = theme === 'dark' ? '' : '-light'

  await closeSidebarIfOpen(page)
  await selectMode(page, 'html')
  await page.waitForSelector('[data-testid="html-editor"]', { timeout: 15_000 })
  await page.waitForTimeout(600)
  await page.locator('.app-shell').screenshot({
    path: join(assets, `app-html${suffix}.png`),
  })
}

async function captureCompare(page, theme) {
  const suffix = theme === 'dark' ? '' : '-light'

  await closeSidebarIfOpen(page)
  await selectMode(page, 'compare')
  await page.waitForSelector('[data-testid="compare-editor"]', {
    timeout: 15_000,
  })
  await page.waitForTimeout(600)

  const htmlPane = page.locator(
    '.compare-editor .html-source-editor .cm-content',
  )
  await htmlPane.click()
  await page.keyboard.press('Meta+a')
  await page.keyboard.insertText('<p>Custom HTML line</p>')
  await page.waitForSelector('.compare-diff-line, .compare-diff-word', {
    timeout: 5000,
  })
  await page.waitForTimeout(400)

  await page.locator('.app-shell').screenshot({
    path: join(assets, `app-compare${suffix}.png`),
  })
}

async function main() {
  await mkdir(assets, { recursive: true })

  const server = spawn('npx', ['serve', 'docs', '-l', '3456'], {
    cwd: root,
    stdio: 'ignore',
  })

  try {
    await waitForServer('http://127.0.0.1:3456/app/')

    for (const theme of ['dark', 'light']) {
      const browser = await chromium.launch({ channel: 'chrome' })
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 2,
        colorScheme: theme,
      })
      const page = await context.newPage()

      await seedShowcaseDraft(page, theme)
      await page.goto('http://127.0.0.1:3456/app/')
      await page.waitForSelector('[data-testid="split-editor"], .app-shell', {
        timeout: 15_000,
      })
      await page.waitForFunction(
        (title) => {
          const input = document.querySelector('[aria-label="Document title"]')
          return input instanceof HTMLInputElement && input.value === title
        },
        showcaseTitle,
        { timeout: 10_000 },
      )
      await page.locator('.cm-content').getByText('Key Principles').waitFor({
        timeout: 10_000,
      })

      await setAppTheme(page, theme)
      await captureFrontmatter(page, theme)
      await captureModes(page, theme)
      await captureHtml(page, theme)
      await captureCompare(page, theme)

      await browser.close()
    }

    console.log('Screenshots saved to docs/assets/ (dark + light)')
  } finally {
    server.kill()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
