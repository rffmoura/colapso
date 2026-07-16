import { describe, expect, it } from 'vitest'
import { createSeededRandom } from './random'

describe('createSeededRandom', () => {
  it('repete a mesma sequência para a mesma semente', () => {
    const a = createSeededRandom(1953)
    const b = createSeededRandom(1953)
    expect(Array.from({ length: 8 }, () => a.next())).toEqual(
      Array.from({ length: 8 }, () => b.next()),
    )
  })

  it('mantém resultados no intervalo [0, 1)', () => {
    const random = createSeededRandom(7)
    for (let i = 0; i < 100; i++) {
      const value = random.next()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})
