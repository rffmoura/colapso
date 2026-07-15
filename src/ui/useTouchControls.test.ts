import { describe, expect, it } from 'vitest'
import { shouldUseTouchControls } from './useTouchControls'

describe('shouldUseTouchControls', () => {
  it('ativa a interação por toque em celulares e tablets', () => {
    expect(shouldUseTouchControls(true, false, 5)).toBe(true)
  })

  it('usa maxTouchPoints como fallback quando não há ponteiro preciso', () => {
    expect(shouldUseTouchControls(false, false, 5)).toBe(true)
  })

  it('mantém o desktop com mouse no fluxo de hover e jogada direta', () => {
    expect(shouldUseTouchControls(false, true, 0)).toBe(false)
  })

  it('prioriza o mouse em computadores híbridos com ponteiro preciso', () => {
    expect(shouldUseTouchControls(false, true, 10)).toBe(false)
  })
})
