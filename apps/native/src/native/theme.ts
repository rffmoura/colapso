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

export function responsiveMetrics(height: number) {
  const compact = height < 500
  return {
    compact,
    gutter: compact ? 6 : 12,
    heroHeight: compact ? 64 : 92,
    boardCardWidth: compact ? 82 : 110,
    boardCardHeight: compact ? 102 : 142,
    handCardWidth: compact ? 100 : 136,
    handCardHeight: compact ? 140 : 192,
  }
}
