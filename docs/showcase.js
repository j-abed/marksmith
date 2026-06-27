/**
 * Showcase interactions: carousel, theme, scroll spy, reveals.
 */
(() => {
  const SHOTS = [
    {
      id: 'split',
      dark: 'assets/app-split.png',
      light: 'assets/app-split-light.png',
      alt: 'Marksmith split view with Markdown source on the left and rendered preview on the right',
      title: 'split.md — Marksmith',
    },
    {
      id: 'raw',
      dark: 'assets/app-raw.png',
      light: 'assets/app-raw-light.png',
      alt: 'Marksmith raw mode with CodeMirror syntax highlighting and formatting toolbar',
      title: 'draft.md — raw mode',
    },
    {
      id: 'preview',
      dark: 'assets/app-preview.png',
      light: 'assets/app-preview-light.png',
      alt: 'Marksmith preview mode showing sanitized GitHub-Flavored Markdown output',
      title: 'draft.md — preview',
    },
    {
      id: 'hybrid',
      dark: 'assets/app-hybrid.png',
      light: 'assets/app-hybrid-light.png',
      alt: 'Marksmith hybrid mode softening Markdown syntax while preserving canonical text',
      title: 'draft.md — hybrid',
    },
    {
      id: 'scroll',
      dark: 'assets/app-split-scrolled.png',
      light: 'assets/app-split-scrolled-light.png',
      alt: 'Marksmith split view with synchronized scrolling between editor and preview',
      title: 'split.md — scroll sync',
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
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const root = document.documentElement
  const img = document.getElementById('hero-shot-img')
  const windowTitle = document.getElementById('hero-shot-window-title')
  const tabs = Array.from(document.querySelectorAll('[data-shot-tab]'))
  const modeTiles = Array.from(document.querySelectorAll('.mode-tile[data-shot-tab]'))
  const status = document.getElementById('carousel-status')
  const header = document.querySelector('.site-header')
  const navLinks = Array.from(document.querySelectorAll('[data-nav]'))
  const themeIcon = document.querySelector('.theme-toggle__icon')
  const themeLabel = document.querySelector('.theme-toggle__label')
  let index = 0
  let timer = null
  let paused = false
  let fading = false

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
    modeTiles.forEach((tile) => {
      tile.classList.toggle('is-active', tile.dataset.shotTab === shotId)
    })
  }

  function setShot(i, { animate = true } = {}) {
    index = i
    const shot = SHOTS[index]
    if (!img || !shot) return

    const nextSrc = shotSrc(shot)
    const currentSrc = img.getAttribute('src') ?? ''

    const apply = () => {
      img.src = nextSrc
      img.alt = shot.alt
      if (windowTitle) windowTitle.textContent = shot.title
      updateTabStates(shot.id)
      if (status) status.textContent = `Showing ${shot.id} mode`
      fading = false
      img.classList.remove('is-fading')
    }

    if (
      animate &&
      !reducedMotion &&
      currentSrc &&
      currentSrc !== nextSrc &&
      !img.src.endsWith(nextSrc)
    ) {
      fading = true
      img.classList.add('is-fading')
      window.setTimeout(apply, 180)
    } else {
      apply()
    }
  }

  function selectShotById(id) {
    const i = SHOTS.findIndex((s) => s.id === id)
    if (i >= 0) setShot(i)
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

  function startAutoplay() {
    if (reducedMotion || paused) return
    stopAutoplay()
    timer = window.setInterval(next, 4500)
  }

  function stopAutoplay() {
    if (timer) window.clearInterval(timer)
    timer = null
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      selectShotById(tab.dataset.shotTab ?? '')
      startAutoplay()
    })
  })

  modeTiles.forEach((tile) => {
    tile.addEventListener('click', () => {
      selectShotById(tile.dataset.shotTab ?? '')
      document.querySelector('.hero-shot')?.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'center',
      })
      startAutoplay()
    })
  })

  document.addEventListener('keydown', (event) => {
    const target = event.target
    if (
      target instanceof HTMLElement &&
      (target.closest('.hero-shot') || target.closest('.mode-tile'))
    ) {
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        next()
        startAutoplay()
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        prev()
        startAutoplay()
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

  applyTheme(getTheme())
  setShot(0, { animate: false })
  startAutoplay()
  header?.classList.toggle('is-scrolled', window.scrollY > 8)
})()
