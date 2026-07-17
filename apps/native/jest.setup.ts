jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(async () => undefined),
  impactAsync: jest.fn(async () => undefined),
  notificationAsync: jest.fn(async () => undefined),
  ImpactFeedbackStyle: { Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
}))

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}))

jest.mock('react-native-worklets', () => ({
  scheduleOnRN: (fn: (...args: unknown[]) => unknown, ...args: unknown[]) => fn(...args),
}))

jest.mock('react-native-reanimated', () => {
  const { Text, View } = require('react-native')
  const builder: Record<string, (...args: unknown[]) => unknown> = {}
  for (const method of ['delay', 'damping', 'duration', 'easing', 'mass', 'reduceMotion', 'springify', 'stiffness']) {
    builder[method] = () => builder
  }
  return {
    __esModule: true,
    default: { Text, View, createAnimatedComponent: (component: unknown) => component },
    Easing: {
      in: (value: unknown) => value,
      inOut: (value: unknown) => value,
      out: (value: unknown) => value,
      cubic: (value: number) => value,
      quad: (value: number) => value,
      poly: () => (value: number) => value,
    },
    ReduceMotion: { System: 'system' },
    FadeIn: builder,
    FadeInDown: builder,
    FadeInUp: builder,
    FadeOut: builder,
    LinearTransition: builder,
    cancelAnimation: jest.fn(),
    useDerivedValue: (factory: () => unknown) => ({ value: factory() }),
    useAnimatedStyle: (factory: () => object) => factory(),
    useReducedMotion: () => false,
    useSharedValue: (value: unknown) => ({ value }),
    withRepeat: (value: unknown) => value,
    withSequence: (...values: unknown[]) => values.at(-1),
    withSpring: jest.fn((value: unknown) => value),
    withTiming: jest.fn((value: unknown) => value),
  }
})

jest.mock('@shopify/react-native-skia', () => {
  const React = require('react')
  const { View } = require('react-native')
  const SkiaNode = ({ children }: { children?: unknown }) => React.createElement(View, null, children)
  return {
    Canvas: SkiaNode,
    Circle: SkiaNode,
    DashPathEffect: SkiaNode,
    Path: SkiaNode,
    Skia: {
      Path: {
        Make: () => ({ moveTo: jest.fn(), cubicTo: jest.fn() }),
      },
    },
  }
})
