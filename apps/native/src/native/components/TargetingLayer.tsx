import { Canvas, Circle, DashPathEffect, Path, Skia } from '@shopify/react-native-skia'
import { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import {
  Easing,
  ReduceMotion,
  useDerivedValue,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import { colors } from '../theme'

export interface TargetFrame {
  id: number
  x: number
  y: number
  width: number
  height: number
}

export interface TargetingMotion {
  active: SharedValue<number>
  sourceUid: SharedValue<number>
  startX: SharedValue<number>
  startY: SharedValue<number>
  endX: SharedValue<number>
  endY: SharedValue<number>
  translateX: SharedValue<number>
  translateY: SharedValue<number>
  hoverId: SharedValue<number>
  valid: SharedValue<number>
  eligibleIds: SharedValue<number[]>
  rootX: SharedValue<number>
  rootY: SharedValue<number>
  targets: SharedValue<TargetFrame[]>
}

const INK_PARTICLES = Array.from({ length: 12 }, (_, index) => ({
  angle: (Math.PI * 2 * index) / 12 + (index % 2) * 0.14,
  distance: 18 + (index % 4) * 9,
  radius: 1.8 + (index % 3) * 0.8,
}))

export function TargetingLayer({
  motion,
  impactTargetId,
  impactKey,
}: {
  motion: TargetingMotion
  impactTargetId?: number | null
  impactKey?: number
}) {
  const impactProgress = useSharedValue(0)

  useEffect(() => {
    if (impactTargetId === null || impactTargetId === undefined) return
    impactProgress.value = 0
    impactProgress.value = withTiming(1, {
      duration: 360,
      easing: Easing.out(Easing.cubic),
      reduceMotion: ReduceMotion.System,
    })
  }, [impactKey, impactProgress, impactTargetId])

  const impactX = useDerivedValue(() => {
    const frame = motion.targets.value.find((target) => target.id === impactTargetId)
    return frame ? frame.x + frame.width / 2 - motion.rootX.value : -100
  })
  const impactY = useDerivedValue(() => {
    const frame = motion.targets.value.find((target) => target.id === impactTargetId)
    return frame ? frame.y + frame.height / 2 - motion.rootY.value : -100
  })
  const line = useDerivedValue(() => {
    const fromX = motion.startX.value - motion.rootX.value
    const fromY = motion.startY.value - motion.rootY.value
    const toX = motion.endX.value - motion.rootX.value
    const toY = motion.endY.value - motion.rootY.value
    const path = Skia.Path.Make()
    const distance = Math.hypot(toX - fromX, toY - fromY)
    const bend = Math.min(56, Math.max(16, distance * 0.14))
    const direction = toY < fromY ? -1 : 1

    path.moveTo(fromX, fromY)
    path.cubicTo(
      fromX + bend,
      fromY + direction * bend * 0.5,
      toX - bend,
      toY - direction * bend * 0.35,
      toX,
      toY,
    )
    return path
  })
  const endpointX = useDerivedValue(() => motion.endX.value - motion.rootX.value)
  const endpointY = useDerivedValue(() => motion.endY.value - motion.rootY.value)
  const neutralOpacity = useDerivedValue(() => motion.active.value * (motion.valid.value ? 0 : 0.72))
  const validOpacity = useDerivedValue(() => motion.active.value * motion.valid.value)
  const endpointRadius = useDerivedValue(() => (motion.valid.value ? 8 : 5))

  return (
    <Canvas pointerEvents="none" style={styles.canvas}>
      <Path
        path={line}
        color={colors.inkSoft}
        opacity={neutralOpacity}
        style="stroke"
        strokeCap="round"
        strokeJoin="round"
        strokeWidth={2.5}
      >
        <DashPathEffect intervals={[8, 5, 2, 5]} />
      </Path>
      <Path
        path={line}
        color={colors.particle}
        opacity={validOpacity}
        style="stroke"
        strokeCap="round"
        strokeJoin="round"
        strokeWidth={4}
      >
        <DashPathEffect intervals={[12, 4, 3, 4]} />
      </Path>
      <Circle
        cx={endpointX}
        cy={endpointY}
        r={endpointRadius}
        color={colors.paperCard}
        opacity={validOpacity}
        style="fill"
      />
      <Circle
        cx={endpointX}
        cy={endpointY}
        r={endpointRadius}
        color={colors.particle}
        opacity={validOpacity}
        style="stroke"
        strokeWidth={3}
      />
      {INK_PARTICLES.map((particle, index) => (
        <InkParticle
          key={index}
          originX={impactX}
          originY={impactY}
          progress={impactProgress}
          angle={particle.angle}
          distance={particle.distance}
          radius={particle.radius}
        />
      ))}
    </Canvas>
  )
}

function InkParticle({
  originX,
  originY,
  progress,
  angle,
  distance,
  radius,
}: {
  originX: SharedValue<number>
  originY: SharedValue<number>
  progress: SharedValue<number>
  angle: number
  distance: number
  radius: number
}) {
  const x = useDerivedValue(() => originX.value + Math.cos(angle) * distance * progress.value)
  const y = useDerivedValue(() => originY.value + Math.sin(angle) * distance * progress.value)
  const opacity = useDerivedValue(() => Math.max(0, 1 - progress.value * 1.15))
  const particleRadius = useDerivedValue(() => radius * (0.65 + progress.value * 0.55))
  return <Circle cx={x} cy={y} r={particleRadius} color={colors.particle} opacity={opacity} />
}

const styles = StyleSheet.create({
  canvas: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 58,
  },
})
