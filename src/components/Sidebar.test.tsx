// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Sidebar } from './Sidebar'
import type { Route } from '../types'

vi.mock('../state/store', () => ({
  useStore: () => ({
    data: { history: {}, settings: { dayStartHour: 0 }, decks: [] },
  }),
}))

vi.mock('../lib/i18n-react', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

const STORAGE_KEY = 'kotoba.sidebarCollapsed'
const noop = () => {}

function renderSidebar(route: Route = { name: 'home' }) {
  return render(
    <Sidebar route={route} onNavigate={noop} onZen={noop} onSearch={noop} />,
  )
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(cleanup)

describe('Sidebar', () => {
  it('разворачивается и сворачивается кнопкой', () => {
    const { container } = renderSidebar()
    const toggle = screen.getByRole('button', { name: 'sidebar.collapse' })

    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(toggle.getAttribute('aria-controls')).toBe('sidebar-nav')

    fireEvent.click(toggle)

    expect(container.querySelector('.sidebar')?.className).toContain('is-collapsed')
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(toggle.getAttribute('aria-label')).toBe('sidebar.expand')
  })

  it('не убирает подписи из разметки при сворачивании', () => {
    const { container } = renderSidebar()
    fireEvent.click(screen.getByRole('button', { name: 'sidebar.collapse' }))

    const label = screen.getByText('nav.study')
    expect(label.className).toBe('nav-label')
    expect(container.querySelectorAll('.nav-label').length).toBe(13)
  })

  it('помечает активный пункт', () => {
    renderSidebar({ name: 'home' })
    expect(screen.getByText('nav.study').closest('button')?.getAttribute('aria-current')).toBe(
      'page',
    )
  })

  it('запоминает состояние между монтированиями', () => {
    const { unmount } = renderSidebar()
    fireEvent.click(screen.getByRole('button', { name: 'sidebar.collapse' }))
    expect(localStorage.getItem(STORAGE_KEY)).toBe('1')
    unmount()

    renderSidebar()
    expect(screen.getByRole('button', { name: 'sidebar.expand' })).toBeTruthy()
  })
})
