// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Onboarding } from './Onboarding'

const { data, setSettings } = vi.hoisted(() => ({
  setSettings: vi.fn(),
  data: {
    settings: {
      dailyGoalType: 'reviews',
      dailyReviewGoal: 20,
      dailyMinuteGoal: 15,
    },
  },
}))

vi.mock('../state/store', () => ({
  useStore: () => ({ data, setSettings }),
}))

vi.mock('../lib/i18n-react', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

afterEach(cleanup)

describe('Onboarding', () => {
  it('оставляет только выбор цели и не предлагает первую колоду', () => {
    render(<Onboarding onFinish={() => {}} />)

    expect(screen.getByText('onboarding.goalTitle')).toBeTruthy()
    expect(screen.queryByText('onboarding.deckTitle')).toBeNull()
  })

  it('сохраняет выбранную цель', () => {
    render(<Onboarding onFinish={() => {}} />)

    fireEvent.click(screen.getByText('30'))
    expect(setSettings).toHaveBeenCalledWith({ dailyReviewGoal: 30 })
  })

  it('завершает знакомство без запуска учебной сессии', () => {
    const onFinish = vi.fn()
    render(<Onboarding onFinish={onFinish} />)

    fireEvent.click(screen.getByText('onboarding.finish'))
    expect(onFinish).toHaveBeenCalledTimes(1)
    expect(onFinish).toHaveBeenCalledWith()
  })
})
