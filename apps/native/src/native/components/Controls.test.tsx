import { fireEvent, render, screen } from '@testing-library/react-native'
import { PaperButton } from './Controls'

describe('PaperButton', () => {
  it('expõe uma área de toque acessível e executa a ação', () => {
    const onPress = jest.fn()
    render(<PaperButton label="Assumir o plantão" onPress={onPress} />)
    fireEvent.press(screen.getByRole('button', { name: 'Assumir o plantão' }))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
