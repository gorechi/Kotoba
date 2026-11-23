import { useI18n } from '../lib/i18n-react'
import { speakJa } from '../lib/tts'
import { Icon } from './Icon'

interface SpeakButtonProps {
  /** Японский текст, который нужно произнести. */
  text: string
  size?: number
  className?: string
  /** Подпись для скринридера и подсказки. */
  label?: string
}

/** Небольшая кнопка озвучки для примеров и других фрагментов текста. */
export function SpeakButton({ text, size = 14, className, label }: SpeakButtonProps) {
  const { t } = useI18n()
  const title = label ?? t('session.listen')

  return (
    <button
      type="button"
      className={`icon-btn speak-button${className ? ` ${className}` : ''}`}
      onClick={() => speakJa(text)}
      title={title}
      aria-label={title}
    >
      <Icon name="speaker" size={size} />
    </button>
  )
}
