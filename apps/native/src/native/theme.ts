import { StyleSheet } from 'react-native'

export const colors = {
  paper: '#F1EBDD',
  paperCard: '#FBF7EC',
  paperDim: '#DED5C4',
  paperDeep: '#CBBFA9',
  ink: '#28221C',
  inkSoft: '#71685F',
  inkFaint: 'rgba(40, 34, 28, 0.16)',
  particle: '#D83B21',
  wave: '#008C98',
  energy: '#E7B932',
  entangle: '#7F389D',
  approve: '#328B5B',
  confidential: '#211D19',
} as const

export const fonts = {
  display: 'ArchivoBlack',
  body: 'Archivo',
  bodySemiBold: 'ArchivoSemiBold',
  bodyBold: 'ArchivoBold',
  type: 'SpecialElite',
} as const

export const shadow = {
  shadowColor: colors.ink,
  shadowOffset: { width: 3, height: 4 },
  shadowOpacity: 0.18,
  shadowRadius: 0,
  elevation: 4,
} as const

export const commonStyles = StyleSheet.create({
  paper: {
    backgroundColor: colors.paper,
  },
  dossier: {
    backgroundColor: colors.paperCard,
    borderColor: colors.ink,
    borderWidth: 2,
    borderRadius: 5,
    ...shadow,
  },
  display: {
    color: colors.ink,
    fontFamily: fonts.display,
    textTransform: 'uppercase',
  },
  typed: {
    color: colors.ink,
    fontFamily: fonts.type,
  },
  body: {
    color: colors.ink,
    fontFamily: fonts.body,
  },
})

export function responsiveMetrics(height: number, width = 1024) {
  const compact = height < 500
  const narrow = compact && width < 760
  const compactScale = Math.max(0.88, Math.min(1.04, width / 844))
  const actionControlSize = compact ? (narrow ? 54 : 60) : 76
  const handCardHeight = compact ? Math.max(202, Math.round(208 * compactScale)) : 252
  return {
    compact,
    narrow,
    gutter: compact ? 6 : 12,
    heroHeight: compact ? 64 : 92,
    boardCardWidth: compact ? Math.round(100 * compactScale) : 122,
    boardCardHeight: compact ? Math.round(112 * compactScale) : 158,
    handCardWidth: compact ? Math.round(158 * compactScale) : 190,
    handCardHeight,
    handCardOverlap: compact ? Math.round((narrow ? 58 : 48) * compactScale) : 62,
    handAreaHeight: compact ? handCardHeight + 108 : 384,
    collapsedHandAreaHeight: compact ? 64 : 92,
    controlDockWidth: compact ? Math.round(82 * compactScale) : 106,
    actionControlSize,
    observeDockWidth: actionControlSize,
  }
}
