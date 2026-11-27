import type { AppData, TextDocument, TextMark } from '../types'
import { buildTextMarks } from './text-marks'
import { uid } from './utils'

/** Создаёт запись загруженного текста. */
export function createTextDocument(
  title: string,
  body: string,
  now = Date.now(),
  marks: TextMark[] = [],
): TextDocument {
  return {
    id: uid('text'),
    title: title.trim(),
    body: body.trim(),
    marks,
    createdAt: now,
  }
}

/** Добавляет текст в начало библиотеки и сразу связывает его с карточками. */
export function addText(
  current: AppData,
  title: string,
  body: string,
  now = Date.now(),
): AppData {
  const cleanBody = body.trim()
  const marks = buildTextMarks(cleanBody, current.cards)
  return {
    ...current,
    texts: [createTextDocument(title, cleanBody, now, marks), ...current.texts],
  }
}
