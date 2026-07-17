import { responsiveMetrics } from './theme'

describe('responsiveMetrics', () => {
  it('mantém fichas e mão dentro das faixas do iPhone em paisagem', () => {
    const metrics = responsiveMetrics(390, 844)

    expect(metrics.boardCardWidth).toBeGreaterThanOrEqual(98)
    expect(metrics.boardCardHeight).toBeGreaterThanOrEqual(110)
    expect(metrics.handCardWidth).toBeGreaterThanOrEqual(156)
    expect(metrics.handCardHeight).toBeGreaterThanOrEqual(206)
    expect(metrics.handCardHeight + 106).toBeLessThanOrEqual(metrics.handAreaHeight)
    expect(metrics.handCardWidth - metrics.handCardOverlap).toBeGreaterThan(100)
    expect(metrics.controlDockWidth).toBeLessThan(100)
    expect(metrics.collapsedHandAreaHeight).toBe(metrics.heroHeight)
  })

  it('preserva a escala ampla do iPad', () => {
    const metrics = responsiveMetrics(768, 1024)

    expect(metrics.compact).toBe(false)
    expect(metrics.boardCardHeight).toBe(158)
    expect(metrics.handCardWidth).toBe(190)
    expect(metrics.handCardHeight).toBe(252)
    expect(metrics.handAreaHeight).toBe(384)
  })

  it('aumenta a sobreposição da mão em iPhones estreitos', () => {
    const metrics = responsiveMetrics(375, 667)

    expect(metrics.narrow).toBe(true)
    expect(metrics.handCardOverlap).toBeGreaterThan(44)
    expect(metrics.handCardWidth - metrics.handCardOverlap).toBeGreaterThan(85)
    expect(metrics.observeDockWidth).toBe(54)
  })
})
