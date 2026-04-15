import { useRef, useCallback } from 'react'

export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const lastRun = useRef<number>(Date.now())
  const timeoutRef = useRef<number | undefined>(undefined)

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      if (now - lastRun.current >= delay) {
        lastRun.current = now
        callback(...args)
      } else {
        timeoutRef.current = window.setTimeout(
          () => {
            lastRun.current = Date.now()
            callback(...args)
          },
          delay - (now - lastRun.current)
        )
      }
    },
    [callback, delay]
  )
}
