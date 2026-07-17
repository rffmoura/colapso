import { act, render } from '@testing-library/react-native'
import type { PresentationCue } from '@colapso/game-session'
import { withTiming } from 'react-native-reanimated'
import { CueHost } from './CueHost'

const mockPlay = jest.fn()

jest.mock('../audio', () => ({
  useSfx: () => ({ play: (...args: unknown[]) => mockPlay(...args) }),
}))

jest.mock('../settings', () => ({
  useNativeSettings: () => ({ haptics: false }),
}))

describe('CueHost', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockPlay.mockClear()
    ;(withTiming as jest.Mock).mockImplementation((value: unknown) => value)
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('confirma a apresentação no fim da cadência sem reiniciar em rerenders', () => {
    const acknowledge = jest.fn()
    const cue: PresentationCue = {
      kind: 'aiDecision',
      action: 'attack',
      blocking: true,
      presentationId: 17,
    }
    const view = render(<CueHost cue={cue} acknowledge={acknowledge} />)

    act(() => jest.advanceTimersByTime(400))
    view.rerender(<CueHost cue={{ ...cue }} acknowledge={acknowledge} />)
    act(() => jest.advanceTimersByTime(279))
    expect(acknowledge).not.toHaveBeenCalled()

    act(() => jest.advanceTimersByTime(1))
    expect(acknowledge).toHaveBeenCalledWith(17)
    expect(acknowledge).toHaveBeenCalledTimes(1)
  })

  it('libera o controlador mesmo se a animação visual falhar', () => {
    const acknowledge = jest.fn()
    ;(withTiming as jest.Mock).mockImplementationOnce(() => {
      throw new Error('falha do runtime de animação')
    })

    render(
      <CueHost
        cue={{
          kind: 'aiDecision',
          action: 'attack',
          blocking: true,
          presentationId: 23,
        }}
        acknowledge={acknowledge}
      />,
    )

    act(() => jest.advanceTimersByTime(680))
    expect(acknowledge).toHaveBeenCalledWith(23)
  })

  it('coreografa cardCommit e reconhece a cue uma única vez', () => {
    const acknowledge = jest.fn()
    const view = render(
      <CueHost
        cue={{
          kind: 'cardCommit',
          owner: 'player',
          handUid: 77,
          defId: 'foton',
          destination: 'board',
          blocking: true,
          presentationId: 31,
        }}
        acknowledge={acknowledge}
      />,
    )

    expect(view.getByText('REGISTRADO')).toBeTruthy()
    act(() => jest.advanceTimersByTime(520))
    expect(acknowledge).toHaveBeenCalledWith(31)
    expect(acknowledge).toHaveBeenCalledTimes(1)
  })

  it('toca o impacto uma vez no ataque e silencia os danos normais seguintes', () => {
    const acknowledge = jest.fn()
    const view = render(
      <CueHost
        cue={{
          kind: 'attack',
          attackerUid: 71,
          target: { kind: 'creature', uid: 72 },
          blocking: true,
          presentationId: 41,
        }}
        acknowledge={acknowledge}
      />,
    )

    expect(mockPlay).not.toHaveBeenCalled()
    act(() => jest.advanceTimersByTime(270))
    expect(mockPlay).toHaveBeenCalledTimes(1)
    expect(mockPlay).toHaveBeenLastCalledWith('hit')

    view.rerender(
      <CueHost
        cue={{
          kind: 'damage',
          target: { kind: 'creature', uid: 72 },
          amount: 3,
          source: 'normal',
          blocking: true,
          presentationId: 42,
        }}
        acknowledge={acknowledge}
      />,
    )
    view.rerender(
      <CueHost
        cue={{
          kind: 'damage',
          target: { kind: 'creature', uid: 71 },
          amount: 2,
          source: 'normal',
          blocking: true,
          presentationId: 43,
        }}
        acknowledge={acknowledge}
      />,
    )

    expect(mockPlay).toHaveBeenCalledTimes(1)
  })

  it('mantém impacto para dano de Contramedida e um som próprio para morte', () => {
    const acknowledge = jest.fn()
    const view = render(
      <CueHost
        cue={{
          kind: 'damage',
          target: { kind: 'hero', owner: 'player' },
          amount: 4,
          source: 'secret',
          blocking: true,
          presentationId: 51,
        }}
        acknowledge={acknowledge}
      />,
    )

    expect(mockPlay).toHaveBeenLastCalledWith('hit')
    view.rerender(
      <CueHost
        cue={{
          kind: 'death',
          uid: 75,
          defId: 'foton',
          owner: 'player',
          source: 'normal',
          blocking: true,
          presentationId: 52,
        }}
        acknowledge={acknowledge}
      />,
    )
    expect(mockPlay).toHaveBeenLastCalledWith('death')
    expect(mockPlay).toHaveBeenCalledTimes(2)
  })

  it('não duplica o som de jogar entre cardCommit e summon', () => {
    const acknowledge = jest.fn()
    const view = render(
      <CueHost
        cue={{
          kind: 'cardCommit',
          owner: 'player',
          handUid: 81,
          defId: 'foton',
          destination: 'board',
          blocking: true,
          presentationId: 61,
        }}
        acknowledge={acknowledge}
      />,
    )

    expect(mockPlay).toHaveBeenCalledTimes(1)
    expect(mockPlay).toHaveBeenLastCalledWith('play')
    view.rerender(
      <CueHost
        cue={{
          kind: 'summon',
          uid: 81,
          blocking: true,
          presentationId: 62,
        }}
        acknowledge={acknowledge}
      />,
    )
    expect(mockPlay).toHaveBeenCalledTimes(1)
  })
})
