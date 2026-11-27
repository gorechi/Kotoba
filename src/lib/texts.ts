import type { AppData, TextDocument } from '../types'
import { uid } from './utils'

/** Создаёт запись загруженного текста. */
export function createTextDocument(
  title: string,
  body: string,
  now = Date.now(),
): TextDocument {
  return {
    id: uid('text'),
    title: title.trim(),
    body: body.trim(),
    createdAt: now,
  }
}

/** Добавляет текст в начало библиотеки. */
export function addText(
  current: AppData,
  title: string,
  body: string,
  now = Date.now(),
): AppData {
  return {
    ...current,
    texts: [createTextDocument(title, body, now), ...current.texts],
  }
}
