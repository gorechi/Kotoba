// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { BackupPanel } from './BackupPanel'
import type { AutoBackupInfo, KotobaApi } from '../types'

vi.mock('../state/store', () => {
  const settings = { autoBackup: 'daily', backupFolder: null }
  return {
    useStore: () => ({
      data: { settings },
      flush: async () => true,
      resetProgress: vi.fn(),
      replaceData: vi.fn(),
      setSettings: vi.fn(),
    }),
  }
})

vi.mock('../lib/i18n-react', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: { intl: 'ru-RU' },
  }),
}))

const backupInfo: AutoBackupInfo = {
  folder: 'D:\\Kotoba',
  defaultFolder: 'D:\\Kotoba',
  isCustom: false,
  frequency: 'daily',
  lastBackupAt: null,
  lastBackupPath: null,
  count: 3,
  retention: 7,
}

beforeEach(() => {
  window.kotoba = {
    checkAutoBackup: async () => backupInfo,
    getAutoBackupInfo: async () => backupInfo,
    createAutoBackup: async () => ({ path: 'D:\\Kotoba\\kotoba-auto.json' }),
  } as unknown as KotobaApi
})

afterEach(() => {
  cleanup()
  delete window.kotoba
})

describe('BackupPanel', () => {
  it('показывает итог создания копии рядом с кнопкой, а не над блоком', async () => {
    render(<BackupPanel />)

    fireEvent.click(screen.getByRole('button', { name: 'autoBackup.backupNow' }))

    await waitFor(() => {
      expect(document.querySelector('.backup-status')?.textContent).toContain(
        'autoBackup.created',
      )
    })

    expect(document.querySelector('.backup-now-row .backup-status')).toBeTruthy()
    expect(document.querySelector('.backup-notices')).toBeNull()
    expect(document.querySelector('.app-toast')).toBeNull()
  })
})
