export type Delimiter = ',' | ';' | '\t'

const DELIMITERS: Delimiter[] = [',', ';', '\t']

/** Считает разделители вне кавычек в одной строке. */
function countDelimiters(line: string, delimiter: Delimiter): number {
  let count = 0
  let quoted = false
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        i += 1
      } else {
        quoted = !quoted
      }
    } else if (!quoted && char === delimiter) {
      count += 1
    }
  }
  return count
}

/**
 * Пытается определить разделитель по первым непустым строкам.
 * Поддерживает запятую, точку с запятой и табуляцию.
 */
export function detectDelimiter(text: string): Delimiter {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .slice(0, 12)

  if (!lines.length) return ','

  let best: Delimiter = ','
  let bestScore = 0

  for (const delimiter of DELIMITERS) {
    let total = 0
    let linesWithDelimiter = 0

    for (const line of lines) {
      const count = countDelimiters(line, delimiter)
      total += count
      if (count > 0) linesWithDelimiter += 1
    }

    if (total === 0) continue

    // Приоритет у разделителя, который встречается в большинстве строк.
    // При равенстве выигрывает тот, где в строке больше колонок.
    const score = linesWithDelimiter * 1000 + total
    if (score > bestScore) {
      best = delimiter
      bestScore = score
    }
  }

  return best
}

/**
 * Разбирает CSV/TSV с поддержкой кавычек, экранированных кавычек
 * и переводов строк внутри полей.
 */
export function parseDelimited(text: string, delimiter: Delimiter): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  const input = text.replace(/^\uFEFF/, '')

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]

    if (quoted) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          quoted = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"' && field === '') {
      quoted = true
    } else if (char === delimiter) {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (char === '\r') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      if (input[i + 1] === '\n') i += 1
    } else {
      field += char
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows
}

/**
 * Читает CSV/TSV как UTF-8, UTF-16LE или Windows-1251.
 * UTF-8 проверяется в строгом режиме, поэтому при типичной
 * русской Excel-выгрузке в cp1251 сработает запасной вариант.
 */
export async function readDelimitedFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder('utf-16le').decode(buffer).replace(/^\uFEFF/, '')
  }

  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder('utf-16be').decode(buffer).replace(/^\uFEFF/, '')
  }

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer).replace(/^\uFEFF/, '')
  } catch {
    return new TextDecoder('windows-1251').decode(buffer).replace(/^\uFEFF/, '')
  }
}
