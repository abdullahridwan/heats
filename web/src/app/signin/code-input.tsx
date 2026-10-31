'use client'
import { useEffect, useRef, useState } from 'react'
import type { ClipboardEvent, KeyboardEvent } from 'react'
import styles from './page.module.css'

// Six single-digit boxes. Typing advances, backspace goes back, and a paste or one-time-code
// autofill fills every box. Calls onComplete once all six are filled. The parent remounts it
// (via key) after a wrong code to clear the boxes.
type Props = {
  onComplete: (code: string) => void
  disabled?: boolean
}

export function CodeInput({ onComplete, disabled = false }: Props) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
  const refs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    refs.current[0]?.focus()
  }, [])

  function write(next: string[], focusIndex: number) {
    setDigits(next)
    if (next.every(d => d !== '')) {
      onComplete(next.join(''))
      return
    }
    refs.current[Math.min(focusIndex, 5)]?.focus()
  }

  function onChange(i: number, raw: string) {
    if (disabled) return
    const clean = raw.replace(/\D/g, '')
    const next = [...digits]
    if (clean.length >= 6) {
      // One-time-code autofill puts the whole code in the first box.
      for (let k = 0; k < 6; k++) next[k] = clean[k]
      write(next, 5)
      return
    }
    if (clean.length === 0) {
      next[i] = ''
      setDigits(next)
      return
    }
    next[i] = clean.slice(-1)
    write(next, i + 1)
  }

  function onPaste(i: number, e: ClipboardEvent<HTMLInputElement>) {
    const clean = e.clipboardData.getData('text').replace(/\D/g, '')
    if (!clean) return
    e.preventDefault()
    const next = [...digits]
    let k = i
    for (const ch of clean) {
      if (k > 5) break
      next[k] = ch
      k++
    }
    write(next, k)
  }

  function onKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && digits[i] === '' && i > 0) {
      e.preventDefault()
      const next = [...digits]
      next[i - 1] = ''
      setDigits(next)
      refs.current[i - 1]?.focus()
    }
  }

  return (
    <fieldset className={styles.fieldset} disabled={disabled}>
      <legend className={styles.legend}>Your code</legend>
      <div className={styles.codeRow}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={el => {
              refs.current[i] = el
            }}
            className={styles.digit}
            aria-label={`Digit ${i + 1}`}
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            value={d}
            onChange={e => onChange(i, e.target.value)}
            onKeyDown={e => onKeyDown(i, e)}
            onPaste={e => onPaste(i, e)}
            onFocus={e => e.currentTarget.select()}
          />
        ))}
      </div>
    </fieldset>
  )
}
