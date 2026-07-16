import { useEffect, useState } from 'react'

const TOUCH_FIRST_QUERY = '(hover: none) and (pointer: coarse)'
const PRECISE_POINTER_QUERY = '(hover: hover) and (pointer: fine)'

export function shouldUseTouchControls(
  touchFirst: boolean,
  precisePointer: boolean,
  maxTouchPoints: number,
) {
  return touchFirst || (maxTouchPoints > 0 && !precisePointer)
}

function detectsTouchFirstControls() {
  if (typeof window === 'undefined') return false

  const touchFirst = window.matchMedia(TOUCH_FIRST_QUERY).matches
  const precisePointer = window.matchMedia(PRECISE_POINTER_QUERY).matches
  return shouldUseTouchControls(touchFirst, precisePointer, navigator.maxTouchPoints)
}

/**
 * Separa capacidade de interação de tamanho da viewport.
 * Tablets e celulares recebem controles por toque; monitores pequenos com mouse não.
 */
export function useTouchControls() {
  const [enabled, setEnabled] = useState(detectsTouchFirstControls)

  useEffect(() => {
    const touchFirst = window.matchMedia(TOUCH_FIRST_QUERY)
    const precisePointer = window.matchMedia(PRECISE_POINTER_QUERY)
    const update = () => setEnabled(detectsTouchFirstControls())

    update()
    touchFirst.addEventListener('change', update)
    precisePointer.addEventListener('change', update)
    return () => {
      touchFirst.removeEventListener('change', update)
      precisePointer.removeEventListener('change', update)
    }
  }, [])

  return enabled
}
