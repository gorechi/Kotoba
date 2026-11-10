(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Scroll progress and sticky header state.
  const progressBar = document.querySelector('.scroll-progress span')
  const header = document.querySelector('.site-header')
  const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')].filter(
    (link) => link.getAttribute('href') !== '#download',
  )
  const navSections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean)

  let frame = 0
  const onScroll = () => {
    if (frame) return
    frame = window.requestAnimationFrame(() => {
      frame = 0
      const scrollY = window.scrollY
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (progressBar) {
        progressBar.style.width = `${max > 0 ? Math.min(100, (scrollY / max) * 100) : 0}%`
      }
      header?.classList.toggle('is-scrolled', scrollY > 12)

      let active = null
      for (const section of navSections) {
        if (section.offsetTop <= scrollY + 150) active = section
      }
      for (const link of navLinks) {
        link.classList.toggle(
          'is-active',
          Boolean(active) && link.getAttribute('href') === `#${active.id}`,
        )
      }
    })
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  // Gentle reveal on scroll.
  const revealItems = [...document.querySelectorAll('.reveal')]
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'))
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    revealItems.forEach((item) => observer.observe(item))
  }

  // Subtle depth: decorative layers drift with the scroll, the hero reacts to the pointer.
  const parallaxLayers = [...document.querySelectorAll('[data-parallax]')]
  if (!reduceMotion && parallaxLayers.length) {
    let parallaxFrame = 0
    const updateParallax = () => {
      parallaxFrame = 0
      const viewport = window.innerHeight
      for (const layer of parallaxLayers) {
        const rect = layer.getBoundingClientRect()
        if (rect.bottom < -viewport * 0.25 || rect.top > viewport * 1.25) continue
        const center = rect.top + rect.height / 2
        const offset = (center - viewport / 2) / viewport
        const speed = Number(layer.dataset.parallax) || 0
        layer.style.setProperty('--shift', `${(-offset * speed * 58).toFixed(2)}px`)
      }
    }
    const requestParallax = () => {
      if (parallaxFrame) return
      parallaxFrame = window.requestAnimationFrame(updateParallax)
    }
    window.addEventListener('scroll', requestParallax, { passive: true })
    window.addEventListener('resize', requestParallax)
    updateParallax()
  }

  const hero = document.querySelector('.hero')
  if (
    !reduceMotion &&
    hero &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches
  ) {
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0
    let pointerFrame = 0
    const animatePointer = () => {
      currentX += (targetX - currentX) * 0.09
      currentY += (targetY - currentY) * 0.09
      hero.style.setProperty('--mx', currentX.toFixed(4))
      hero.style.setProperty('--my', currentY.toFixed(4))
      if (Math.abs(targetX - currentX) > 0.0015 || Math.abs(targetY - currentY) > 0.0015) {
        pointerFrame = window.requestAnimationFrame(animatePointer)
      } else {
        pointerFrame = 0
      }
    }
    const startPointer = () => {
      if (pointerFrame) return
      pointerFrame = window.requestAnimationFrame(animatePointer)
    }
    hero.addEventListener('pointermove', (event) => {
      const rect = hero.getBoundingClientRect()
      targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2
      targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2
      startPointer()
    })
    hero.addEventListener('pointerleave', () => {
      targetX = 0
      targetY = 0
      startPointer()
    })
  }

  // The hero card flips on click, Enter or Space.
  document.querySelectorAll('[data-flip]').forEach((card) => {
    card.addEventListener('click', () => {
      const flipped = card.classList.toggle('is-flipped')
      card.setAttribute(
        'aria-label',
        flipped ? 'Показать лицевую сторону карточки みず' : 'Перевернуть карточку みず',
      )
    })
  })

  // Reading / writing demo.
  const modeTabs = [...document.querySelectorAll('.mode-tab')]
  const modePanels = [...document.querySelectorAll('.mode-panel')]
  const activateMode = (mode) => {
    for (const tab of modeTabs) {
      const active = tab.dataset.mode === mode
      tab.classList.toggle('is-active', active)
      tab.setAttribute('aria-selected', String(active))
      tab.tabIndex = active ? 0 : -1
    }
    for (const panel of modePanels) {
      panel.hidden = panel.dataset.panel !== mode
    }
  }

  for (const tab of modeTabs) {
    tab.addEventListener('click', () => activateMode(tab.dataset.mode))
    tab.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      event.preventDefault()
      const index = modeTabs.indexOf(tab)
      const next =
        event.key === 'ArrowRight'
          ? modeTabs[(index + 1) % modeTabs.length]
          : modeTabs[(index - 1 + modeTabs.length) % modeTabs.length]
      next.focus()
      activateMode(next.dataset.mode)
    })
  }

  if (modeTabs.length) activateMode(modeTabs.find((tab) => tab.classList.contains('is-active'))?.dataset.mode ?? 'reading')

  for (const panel of modePanels) {
    const card = panel.querySelector('.demo-card')
    const button = panel.querySelector('.demo-reveal')
    if (!card || !button) continue
    button.setAttribute('aria-expanded', 'false')
    button.addEventListener('click', () => {
      const revealed = card.classList.toggle('is-revealed')
      button.textContent = revealed ? 'Скрыть ответ' : 'Показать ответ'
      button.setAttribute('aria-expanded', String(revealed))
    })
  }
})()
