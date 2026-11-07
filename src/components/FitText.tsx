import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

interface FitTextProps {
  text: string
  className?: string
  minFontSize?: number
  maxFontSize?: number
  title?: string
}

/**
 * Подбирает максимальный размер шрифта, при котором текст целиком
 * помещается в отведённую ему область (и по ширине, и по высоте).
 */
export function FitText({
  text,
  className,
  minFontSize = 14,
  maxFontSize = 150,
  title,
}: FitTextProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)

  const fit = useCallback(() => {
    const box = boxRef.current
    const span = textRef.current
    if (!box || !span) return

    const styles = getComputedStyle(box)
    const paddingX =
      parseFloat(styles.paddingLeft || '0') + parseFloat(styles.paddingRight || '0')
    const paddingY =
      parseFloat(styles.paddingTop || '0') + parseFloat(styles.paddingBottom || '0')
    const availableWidth = box.clientWidth - paddingX
    const availableHeight = box.clientHeight - paddingY
    if (availableWidth <= 0 || availableHeight <= 0) return

    const fits = () =>
      span.scrollWidth <= availableWidth + 0.5 && span.scrollHeight <= availableHeight + 0.5

    span.style.fontSize = `${maxFontSize}px`
    if (fits()) return

    let low = minFontSize
    let high = maxFontSize
    let best = minFontSize

    for (let step = 0; step < 14; step += 1) {
      const middle = (low + high) / 2
      span.style.fontSize = `${middle}px`
      if (fits()) {
        best = middle
        low = middle
      } else {
        high = middle
      }
    }

    span.style.fontSize = `${Math.max(minFontSize, Math.floor(best * 10) / 10)}px`
  }, [maxFontSize, minFontSize])

  useLayoutEffect(() => {
    fit()
  }, [fit, text])

  useEffect(() => {
    const box = boxRef.current
    if (!box) return

    const observer = new ResizeObserver(fit)
    observer.observe(box)

    let cancelled = false
    if (document.fonts?.ready) {
      document.fonts.ready
        .then(() => {
          if (!cancelled) fit()
        })
        .catch(() => undefined)
    }

    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [fit])

  return (
    <div ref={boxRef} className={`fit-text${className ? ` ${className}` : ''}`} title={title}>
      <span ref={textRef} className="fit-text-inner">
        {text}
      </span>
    </div>
  )
}
