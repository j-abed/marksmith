/**
 * Showcase interactions: carousel, mode showcase, theme, scroll spy, reveals.
 */
(() => {
  const SHOTS = [
    {
      id: 'split',
      dark: 'assets/app-split.png',
      light: 'assets/app-split-light.png',
      alt: 'Marksmith split view with Markdown source on the left and rendered preview on the right',
      title: 'project-brief.md — Marksmith',
    },
    {
      id: 'raw',
      dark: 'assets/app-raw.png',
      light: 'assets/app-raw-light.png',
      alt: 'Marksmith raw mode with CodeMirror syntax highlighting and formatting toolbar',
      title: 'project-brief.md — raw mode',
    },
    {
      id: 'preview',
      dark: 'assets/app-preview.png',
      light: 'assets/app-preview-light.png',
      alt: 'Marksmith preview mode showing sanitized GitHub-Flavored Markdown output',
      title: 'project-brief.md — preview',
    },
    {
      id: 'hybrid',
      dark: 'assets/app-hybrid.png',
      light: 'assets/app-hybrid-light.png',
      alt: 'Marksmith hybrid mode softening Markdown syntax while preserving canonical text',
      title: 'project-brief.md — hybrid',
    },
    {
      id: 'frontmatter',
      dark: 'assets/app-frontmatter.png',
      light: 'assets/app-frontmatter-light.png',
      alt: 'Marksmith frontmatter panel editing YAML title, date, and tags beside split view',
      title: 'project-brief.md — frontmatter',
    },
    {
      id: 'compare',
      dark: 'assets/app-compare.png',
      light: 'assets/app-compare-light.png',
      alt: 'Marksmith compare mode showing Markdown beside HTML with diff highlights',
      title: 'project-brief.md — compare',
    },
  ]

  const EDITOR_MODES = [
    {
      id: 'raw',
      title: 'Source editing',
      desc: 'CodeMirror with GFM syntax highlighting and toolbar commands.',
      dark: 'assets/app-raw.png',
      light: 'assets/app-raw-light.png',
      alt: 'Marksmith raw mode with CodeMirror syntax highlighting and formatting toolbar',
    },
    {
      id: 'preview',
      title: 'Rendered output',
      desc: 'Sanitized HTML with code highlighting and technical-docs typography.',
      dark: 'assets/app-preview.png',
      light: 'assets/app-preview-light.png',
      alt: 'Marksmith preview mode showing sanitized GitHub-Flavored Markdown output',
    },
    {
      id: 'split',
      title: 'Live side-by-side',
      desc: 'Edit and preview together with linked scrolling.',
      dark: 'assets/app-split.png',
      light: 'assets/app-split-light.png',
      alt: 'Marksmith split view with Markdown source on the left and rendered preview on the right',
    },
    {
      id: 'hybrid',
      title: 'Softened syntax',
      desc: 'Prototype decorations for headings, emphasis, code, and links.',
      dark: 'assets/app-hybrid.png',
      light: 'assets/app-hybrid-light.png',
      alt: 'Marksmith hybrid mode softening Markdown syntax while preserving canonical text',
    },
    {
      id: 'html',
      title: 'Edit rendered HTML',
      desc: 'Import LLM output; edits round-trip to canonical Markdown.',
      dark: 'assets/app-html.png',
      light: 'assets/app-html-light.png',
      alt: 'Marksmith HTML mode editing rendered output with Markdown round-trip',
    },
    {
      id: 'compare',
      title: 'Markdown ↔ HTML',
      desc: 'Side-by-side diff, scroll sync, and sync/apply actions.',
      dark: 'assets/app-compare.png',
      light: 'assets/app-compare-light.png',
      alt: 'Marksmith compare mode showing Markdown beside HTML with diff highlights',
    },
  ]

  const STATIC_SHOTS = {
    'split-scrolled': {
      dark: 'assets/app-split-scrolled.png',
      light: 'assets/app-split-scrolled-light.png',
    },
    raw: {
      dark: 'assets/app-raw.png',
      light: 'assets/app-raw-light.png',
    },
    frontmatter: {
      dark: 'assets/app-frontmatter.png',
      light: 'assets/app-frontmatter-light.png',
    },
    compare: {
      dark: 'assets/app-compare.png',
      light: 'assets/app-compare-light.png',
    },
  }

  const MODE_CYCLE_MS = 4500

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const root = document.documentElement
  const img = document.getElementById('hero-shot-img')
  const windowTitle = document.getElementById('hero-shot-window-title')
  const tabs = Array.from(document.querySelectorAll('.hero-shot__tab[data-shot-tab]'))
  const status = document.getElementById('carousel-status')
  const header = document.querySelector('.site-header')
  const navLinks = Array.from(document.querySelectorAll('[data-nav]'))
  const themeIcon = document.querySelector('.theme-toggle__icon')
  const themeLabel = document.querySelector('.theme-toggle__label')

  const modeShowcase = document.querySelector('[data-mode-showcase]')
  const modeImg = document.getElementById('mode-showcase-img')
  const modeLabel = document.getElementById('mode-showcase-label')
  const modeTitle = document.getElementById('mode-showcase-heading')
  const modeDesc = document.getElementById('mode-showcase-desc')
  const modeStatus = document.getElementById('mode-showcase-status')
  const modeTabs = Array.from(document.querySelectorAll('.mode-showcase__tab[data-mode-id]'))

  let index = 0
  let timer = null
  let paused = false
  let fading = false

  let modeIndex = 0
  let modeTimer = null
  let modePaused = false
  let modeFading = false
  let modeVisible = false

  function getTheme() {
    return root.dataset.theme === 'light' ? 'light' : 'dark'
  }

  function shotSrc(shot) {
    return getTheme() === 'light' ? shot.light : shot.dark
  }

  function updateTabStates(shotId) {
    tabs.forEach((tab) => {
      const active = tab.dataset.shotTab === shotId
      tab.setAttribute('aria-selected', String(active))
      tab.classList.toggle('is-active', active)
    })
  }

  function crossfadeImage(targetImg, nextSrc, onApply) {
    if (!targetImg) return

    const currentSrc = targetImg.getAttribute('src') ?? ''
    const apply = () => {
      onApply()
      targetImg.classList.remove('is-fading')
    }

    if (
      !reducedMotion &&
      currentSrc &&
      currentSrc !== nextSrc &&
      !targetImg.src.endsWith(nextSrc)
    ) {
      targetImg.classList.add('is-fading')
      window.setTimeout(apply, 180)
    } else {
      apply()
    }
  }

  function setShot(i, { animate = true } = {}) {
    index = i
    const shot = SHOTS[index]
    if (!img || !shot) return

    const nextSrc = shotSrc(shot)
    fading = animate

    crossfadeImage(img, nextSrc, () => {
      img.src = nextSrc
      img.alt = shot.alt
      if (windowTitle) windowTitle.textContent = shot.title
      updateTabStates(shot.id)
      if (status) status.textContent = `Showing ${shot.id} mode`
      fading = false
    })
  }

  function selectShotById(id) {
    const i = SHOTS.findIndex((s) => s.id === id)
    if (i >= 0) setShot(i)
  }

  function restartModeProgress() {
    modeTabs.forEach((tab) => {
      tab.classList.remove('is-active')
      void tab.offsetWidth
      if (tab.dataset.modeId === EDITOR_MODES[modeIndex]?.id) {
        tab.classList.add('is-active')
      }
    })
  }

  function setModeShowcase(i, { animate = true } = {}) {
    modeIndex = i
    const mode = EDITOR_MODES[modeIndex]
    if (!modeImg || !mode) return

    const nextSrc = getTheme() === 'light' ? mode.light : mode.dark
    modeFading = animate

    crossfadeImage(modeImg, nextSrc, () => {
      modeImg.src = nextSrc
      modeImg.alt = mode.alt
      if (modeLabel) modeLabel.textContent = mode.id
      if (modeTitle) modeTitle.textContent = mode.title
      if (modeDesc) modeDesc.textContent = mode.desc
      if (modeStatus) modeStatus.textContent = `Showing ${mode.id} mode`
      modeTabs.forEach((tab) => {
        const active = tab.dataset.modeId === mode.id
        tab.classList.toggle('is-active', active)
        tab.setAttribute('aria-selected', String(active))
      })
      restartModeProgress()
      modeFading = false
    })
  }

  function selectModeById(id) {
    const i = EDITOR_MODES.findIndex((mode) => mode.id === id)
    if (i >= 0) setModeShowcase(i)
  }

  function updateStaticShots() {
    const theme = getTheme()
    document.querySelectorAll('[data-showcase-shot]').forEach((el) => {
      const key = el.dataset.showcaseShot
      const paths = STATIC_SHOTS[key]
      if (!paths || !(el instanceof HTMLImageElement)) return
      el.src = theme === 'light' ? paths.light : paths.dark
    })
  }

  function next() {
    if (fading) return
    setShot((index + 1) % SHOTS.length)
  }

  function prev() {
    if (fading) return
    setShot((index - 1 + SHOTS.length) % SHOTS.length)
  }

  function nextMode() {
    if (modeFading) return
    setModeShowcase((modeIndex + 1) % EDITOR_MODES.length)
  }

  function startAutoplay() {
    if (reducedMotion || paused) return
    stopAutoplay()
    timer = window.setInterval(next, MODE_CYCLE_MS)
  }

  function stopAutoplay() {
    if (timer) window.clearInterval(timer)
    timer = null
  }

  function startModeAutoplay() {
    if (reducedMotion || modePaused || !modeVisible) return
    stopModeAutoplay()
    modeTimer = window.setInterval(nextMode, MODE_CYCLE_MS)
  }

  function stopModeAutoplay() {
    if (modeTimer) window.clearInterval(modeTimer)
    modeTimer = null
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      selectShotById(tab.dataset.shotTab ?? '')
      startAutoplay()
    })
  })

  modeTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      selectModeById(tab.dataset.modeId ?? '')
      startModeAutoplay()
    })
  })

  document.addEventListener('keydown', (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return

    if (target.closest('.hero-shot')) {
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        next()
        startAutoplay()
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        prev()
        startAutoplay()
      }
      return
    }

    if (target.closest('[data-mode-showcase]')) {
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        nextMode()
        startModeAutoplay()
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setModeShowcase((modeIndex - 1 + EDITOR_MODES.length) % EDITOR_MODES.length)
        startModeAutoplay()
      }
    }
  })

  const viewport = document.querySelector('.hero-shot__viewport')
  viewport?.addEventListener('mouseenter', () => {
    paused = true
    stopAutoplay()
  })
  viewport?.addEventListener('mouseleave', () => {
    paused = false
    startAutoplay()
  })
  viewport?.addEventListener('focusin', () => {
    paused = true
    stopAutoplay()
  })
  viewport?.addEventListener('focusout', () => {
    paused = false
    startAutoplay()
  })

  modeShowcase?.addEventListener('mouseenter', () => {
    modePaused = true
    modeShowcase.classList.add('is-paused')
    stopModeAutoplay()
  })
  modeShowcase?.addEventListener('mouseleave', () => {
    modePaused = false
    modeShowcase.classList.remove('is-paused')
    startModeAutoplay()
  })
  modeShowcase?.addEventListener('focusin', () => {
    modePaused = true
    modeShowcase.classList.add('is-paused')
    stopModeAutoplay()
  })
  modeShowcase?.addEventListener('focusout', () => {
    modePaused = false
    modeShowcase.classList.remove('is-paused')
    startModeAutoplay()
  })

  const themeToggle = document.getElementById('theme-toggle')
  const stored = localStorage.getItem('marksmith:showcase-theme')
  if (stored === 'light' || stored === 'dark') {
    root.dataset.theme = stored
  } else if (!root.dataset.theme) {
    root.dataset.theme = window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark'
  }

  function updateThemeToggleUi(theme) {
    themeToggle?.setAttribute(
      'aria-label',
      `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`,
    )
    if (themeIcon) themeIcon.textContent = theme === 'dark' ? '☾' : '☀'
    if (themeLabel) themeLabel.textContent = theme === 'dark' ? 'Dark' : 'Light'
  }

  function applyTheme(next) {
    root.dataset.theme = next
    localStorage.setItem('marksmith:showcase-theme', next)
    root.style.colorScheme = next
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.content = next === 'light' ? '#f8f7f4' : '#08080a'
    }
    updateThemeToggleUi(next)
    setShot(index, { animate: false })
    setModeShowcase(modeIndex, { animate: false })
    updateStaticShots()
  }

  themeToggle?.addEventListener('click', () => {
    applyTheme(getTheme() === 'dark' ? 'light' : 'dark')
  })

  window.addEventListener(
    'scroll',
    () => {
      header?.classList.toggle('is-scrolled', window.scrollY > 8)
    },
    { passive: true },
  )

  const sectionMap = {
    philosophy: document.getElementById('philosophy'),
    features: document.getElementById('features'),
    modes: document.getElementById('modes'),
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
        }
      })
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
  )

  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))

  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const id = entry.target.id
        navLinks.forEach((link) => {
          link.classList.toggle('is-active', link.dataset.nav === id)
        })
      })
    },
    { threshold: 0.35, rootMargin: '-20% 0px -55% 0px' },
  )

  Object.values(sectionMap).forEach((section) => {
    if (section) navObserver.observe(section)
  })

  const modeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        modeVisible = entry.isIntersecting
        if (modeVisible) {
          startModeAutoplay()
        } else {
          stopModeAutoplay()
        }
      })
    },
    { threshold: 0.35 },
  )

  if (modeShowcase) modeObserver.observe(modeShowcase)

  applyTheme(getTheme())
  setShot(0, { animate: false })
  setModeShowcase(0, { animate: false })
  startAutoplay()
  header?.classList.toggle('is-scrolled', window.scrollY > 8)
})()
