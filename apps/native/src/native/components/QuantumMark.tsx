import Svg, { Circle, Path } from 'react-native-svg'
import { colors } from '../theme'

export function QuantumMark({ size = 54 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityElementsHidden>
      <Circle cx="50" cy="50" r="42" fill="none" stroke={colors.ink} strokeWidth="12" />
      <Path d="M12 50c10.8-15.5 23.6-23.2 38-23.2S77.2 34.5 88 50C77.2 65.5 64.4 73.2 50 73.2S22.8 65.5 12 50Z" fill={colors.ink} />
      <Circle cx="44.5" cy="50" r="16.5" fill={colors.particle} />
      <Circle cx="55.5" cy="50" r="16.5" fill={colors.wave} />
      <Circle cx="50" cy="50" r="12.7" fill={colors.ink} stroke={colors.paperCard} strokeWidth="2" />
    </Svg>
  )
}
