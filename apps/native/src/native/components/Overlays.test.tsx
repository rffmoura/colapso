import { fireEvent, render, screen } from '@testing-library/react-native'
import { CardInspector } from './Overlays'

describe('CardInspector', () => {
  it('exige uma segunda ação explícita antes de jogar a ficha', () => {
    const onPlay = jest.fn()
    render(<CardInspector visible card={{ uid: 7, defId: 'foton' }} canPlay onClose={jest.fn()} onPlay={onPlay} onKeyword={jest.fn()} />)
    expect(onPlay).not.toHaveBeenCalled()
    fireEvent.press(screen.getByRole('button', { name: 'Jogar ficha' }))
    expect(onPlay).toHaveBeenCalledTimes(1)
  })

  it('desativa a confirmação quando faltam qubits', () => {
    render(<CardInspector visible card={{ uid: 8, defId: 'singularidade' }} canPlay={false} onClose={jest.fn()} onPlay={jest.fn()} onKeyword={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Qubits insuficientes' }).props.accessibilityState.disabled).toBe(true)
  })
})
