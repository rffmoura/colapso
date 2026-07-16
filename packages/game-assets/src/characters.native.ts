declare const require: (path: string) => number

export const characterArt = {
  foton: require('../assets/characters/foton.webp'),
  neutrino: require('../assets/characters/neutrino.webp'),
  sentinela: require('../assets/characters/sentinela.webp'),
  eletron: require('../assets/characters/eletron.webp'),
  gato: require('../assets/characters/gato.webp'),
  colapsador: require('../assets/characters/colapsador.webp'),
  ondapiloto: require('../assets/characters/ondapiloto.webp'),
  quasar: require('../assets/characters/quasar.webp'),
  singularidade: require('../assets/characters/singularidade.webp'),
} as const
