// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Tour } from './Tour'
import { TOUR_STEPS } from '../lib/tour'

vi.mock('../lib/i18n-react', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect
}

function makeProps() {
  return {
    stage: 'welcome' as const,
    stepIndex: 0,
    onStart: vi.fn(),
    onNext: vi.fn(),
    onBack: vi.fn(),
    onSkip: vi.fn(),
    onFinish: vi.fn(),
  }
}

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
    window.setTimeout(() => callback(0), 0),
  )
  vi.stubGlobal('cancelAnimationFrame', (id: number) => window.clearTimeout(id))
})

afterEach(() => {
  cleanup()
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

describe('Tour', () => {
  it('на приветствии показывает кнопки начала и пропуска', () => {
    const props = makeProps()
    render(<Tour {...props} />)

    expect(screen.getByText('tour.welcomeTitle')).toBeTruthy()
    fireEvent.click(screen.getByText('tour.start'))
    expect(props.onStart).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByText('tour.skip'))
    expect(props.onSkip).toHaveBeenCalledTimes(1)
  })

  it('подсвечивает пункт меню и основную область раздела', async () => {
    document.body.innerHTML =
      '<button data-tour="nav-home">nav</button><main data-tour="content">content</main>'
    const nav = document.querySelector<HTMLElement>('[data-tour="nav-home"]')!
    const content = document.querySelector<HTMLElement>('[data-tour="content"]')!
    vi.spyOn(nav, 'getBoundingClientRect').mockReturnValue(rect(10, 20, 60, 40))
    vi.spyOn(content, 'getBoundingClientRect').mockReturnValue(rect(100, 20, 700, 400))

    const props = makeProps()
    render(<Tour {...props} stage="running" />)

    await waitFor(() => expect(document.querySelectorAll('.tour-ring')).toHaveLength(2))
    expect(screen.getByText('tour.studyTitle')).toBeTruthy()
  })

  it('на первом шаге «Назад» недоступна, а «Далее» ведёт вперёд', () => {
    const props = makeProps()
    render(<Tour {...props} stage="running" />)

    const back = screen.getByText('tour.back').closest('button') as HTMLButtonElement
    expect(back.disabled).toBe(true)
    fireEvent.click(screen.getByText('tour.next'))
    expect(props.onNext).toHaveBeenCalledTimes(1)
  })

  it('показывает финальный экран после последнего раздела', () => {
    const props = makeProps()
    render(<Tour {...props} stage="running" stepIndex={TOUR_STEPS.length} />)

    expect(screen.getByText('tour.finalTitle')).toBeTruthy()
    fireEvent.click(screen.getByText('tour.finish'))
    expect(props.onFinish).toHaveBeenCalledTimes(1)
  })

  it('реагирует на клавиатуру: Escape пропускает, стрелки листают', () => {
    const props = makeProps()
    render(<Tour {...props} stage="running" stepIndex={1} />)

    fireEvent.keyDown(document, { key: 'ArrowRight' })
    expect(props.onNext).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(document, { key: 'ArrowLeft' })
    expect(props.onBack).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(props.onSkip).toHaveBeenCalledTimes(1)
  })
})
