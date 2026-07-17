import { createSeededRandom, type Creature } from '@colapso/game-core'
import { GameSessionController } from '@colapso/game-session'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NativeGameBoard } from './GameBoard'

const safeAreaMetrics = {
  frame: { x: 0, y: 0, width: 844, height: 390 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
}

jest.mock('./audio', () => ({ useSfx: () => ({ play: jest.fn() }) }))
jest.mock('./settings', () => ({ useNativeSettings: () => ({ haptics: false }) }))
jest.mock('./components/MemoHost', () => ({ MemoHost: () => null }))

jest.mock('react-native-gesture-handler', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react')
  const makeGesture = () => {
    const gesture: Record<string, (...args: unknown[]) => unknown> = {}
    for (const method of ['activeOffsetY', 'enabled', 'minDistance', 'onEnd', 'onFinalize', 'onStart', 'onUpdate']) {
      gesture[method] = () => gesture
    }
    return gesture
  }
  return {
    Gesture: { Pan: makeGesture },
    GestureDetector: ({ children }: { children: unknown }) => React.createElement(React.Fragment, null, children),
  }
})

async function playableController() {
  const controller = new GameSessionController({
    random: createSeededRandom(1953),
    autoAcknowledge: true,
  })
  await controller.send({ type: 'START_RUN' })
  const secret = controller.getSnapshot().run!.offeredSecrets[0]
  await controller.send({ type: 'CHOOSE_INITIAL_SECRET', secret })
  await controller.send({ type: 'BEGIN_DUEL' })

  const game = controller.getSnapshot().game
  game.turn = 4
  game.active = 'player'
  game.winner = null
  game.sides.player.hand = []
  const creature = (uid: number, defId: string, owner: Creature['owner'], summonedTurn: number, attacksUsed: number): Creature => ({
    uid,
    defId,
    owner,
    collapsed: 0,
    hp: 3,
    attacksUsed,
    summonedTurn,
    entangledWith: null,
    tempKeywords: [],
    ghostProtected: false,
  })
  game.board.player = [
    creature(801, 'foton', 'player', 3, 0),
    creature(802, 'neutrino', 'player', 4, 0),
    creature(803, 'eletron', 'player', 3, 1),
  ]
  game.board.ai = [creature(901, 'sentinela', 'ai', 3, 0)]
  return controller
}

describe('NativeGameBoard', () => {
  it('mostra prontidão antes do toque e não oferece um botão Cancelar', async () => {
    const controller = await playableController()
    const view = render(
      <SafeAreaProvider initialMetrics={safeAreaMetrics}>
        <NativeGameBoard controller={controller} onOpenSettings={jest.fn()} />
      </SafeAreaProvider>,
    )

    expect(view.getByText('PRONTO')).toBeTruthy()
    expect(view.getByText('PREPARANDO')).toBeTruthy()
    expect(view.getByText('JÁ AGIU')).toBeTruthy()
    expect(view.queryByText('Cancelar')).toBeNull()
  })

  it('marca somente as fichas que podem ser jogadas com os qubits atuais', async () => {
    const controller = await playableController()
    controller.getSnapshot().game.sides.player.hand = [
      { uid: 811, defId: 'foton' },
      { uid: 812, defId: 'singularidade' },
    ]
    controller.getSnapshot().game.sides.player.qubits = 1
    const view = render(
      <SafeAreaProvider initialMetrics={safeAreaMetrics}>
        <NativeGameBoard controller={controller} onOpenSettings={jest.fn()} />
      </SafeAreaProvider>,
    )

    expect(view.getByTestId('hand-card-811-playable')).toBeTruthy()
    expect(view.queryByTestId('hand-card-812-playable')).toBeNull()
    expect(view.getByLabelText('Fóton. Jogável por 1 qubit')).toBeTruthy()
    expect(view.getByLabelText('A Fome. Faltam 6Q')).toBeTruthy()
  })

  it('cancela o atacante tocando novamente ou na área vazia', async () => {
    const controller = await playableController()
    const view = render(
      <SafeAreaProvider initialMetrics={safeAreaMetrics}>
        <NativeGameBoard controller={controller} onOpenSettings={jest.fn()} />
      </SafeAreaProvider>,
    )
    const readyCard = view.getByLabelText(/Fóton\. PRONTO/)

    await act(async () => fireEvent.press(readyCard, { stopPropagation: jest.fn() }))
    await waitFor(() => expect(controller.getSnapshot().selection).toEqual({ type: 'attacker', uid: 801 }))

    await act(async () => fireEvent.press(readyCard, { stopPropagation: jest.fn() }))
    await waitFor(() => expect(controller.getSnapshot().selection).toBeNull())

    await act(async () => fireEvent.press(readyCard, { stopPropagation: jest.fn() }))
    await act(async () => fireEvent.press(view.getByTestId('lane-player-clear')))
    await waitFor(() => expect(controller.getSnapshot().selection).toBeNull())
  })

  it('limpa a ficha da mão pelo backdrop sem fechar a mão', async () => {
    const controller = await playableController()
    controller.getSnapshot().game.sides.player.hand = [{ uid: 811, defId: 'gato' }]
    controller.getSnapshot().game.sides.player.qubits = 8
    const view = render(
      <SafeAreaProvider initialMetrics={safeAreaMetrics}>
        <NativeGameBoard controller={controller} onOpenSettings={jest.fn()} />
      </SafeAreaProvider>,
    )

    await act(async () => fireEvent.press(view.getByLabelText(/O Gato/), { stopPropagation: jest.fn() }))
    expect(view.getByText('JOGAR FICHA')).toBeTruthy()

    await act(async () => fireEvent.press(view.getByLabelText('Limpar seleção da ficha')))
    expect(view.queryByText('JOGAR FICHA')).toBeNull()
    expect(view.getByLabelText('Ocultar mão (1)')).toBeTruthy()
  })

  it('cancela a escolha de face pelo backdrop', async () => {
    const controller = await playableController()
    controller.getSnapshot().game.board.player[0].collapsed = null
    controller.getSnapshot().selection = { type: 'measureFace', handUid: 812, targetUid: 801 }
    const view = render(
      <SafeAreaProvider initialMetrics={safeAreaMetrics}>
        <NativeGameBoard controller={controller} onOpenSettings={jest.fn()} />
      </SafeAreaProvider>,
    )

    expect(view.getByText(/Escolha o estado de Fóton/)).toBeTruthy()
    await act(async () => fireEvent.press(view.getByLabelText('Voltar ao tabuleiro')))
    await waitFor(() => expect(controller.getSnapshot().selection).toBeNull())
  })
})
