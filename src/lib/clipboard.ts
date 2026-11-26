/** Запись в системный буфер обмена: Electron API, затем браузерный, затем старый способ. */
export async function writeClipboardText(text: string): Promise<boolean> {
  if (window.kotoba?.writeClipboardText) {
    try {
      return await window.kotoba.writeClipboardText(text)
    } catch {
      /* fall through */
    }
  }
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      /* fall through */
    }
  }
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.left = '-9999px'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const copied = document.execCommand?.('copy') ?? false
    area.remove()
    return copied
  } catch {
    return false
  }
}

/** Чтение системного буфера обмена с тем же запасным путём. */
export async function readClipboardText(): Promise<string> {
  if (window.kotoba?.readClipboardText) {
    try {
      return await window.kotoba.readClipboardText()
    } catch {
      /* fall through */
    }
  }
  if (navigator.clipboard?.readText) {
    try {
      return await navigator.clipboard.readText()
    } catch {
      /* fall through */
    }
  }
  return ''
}
