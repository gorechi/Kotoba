import type { ReactNode, SelectHTMLAttributes } from 'react'
import { Icon } from './Icon'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode
}

/**
 * Нативный select с кастомной стрелкой.
 * Нужен, чтобы положение стрелки задавалось вёрсткой, а не браузером.
 */
export function Select({ children, ...rest }: SelectProps) {
  return (
    <span className="select">
      <select {...rest}>{children}</select>
      <Icon name="chevron-down" size={16} className="select-chevron" />
    </span>
  )
}
