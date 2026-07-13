import type { CardDef } from './types'

export const CARDS: Record<string, CardDef> = {
  foton: {
    id: 'foton',
    name: 'Fóton Errante',
    cost: 1,
    type: 'criatura',
    faces: [
      { label: 'Raio', attack: 2, health: 1, keywords: ['veloz'] },
      { label: 'Brilho', attack: 1, health: 2, keywords: [] },
    ],
    text: 'Raio 2/1 Veloz ⟷ Brilho 1/2',
    flavor: 'Viaja há treze bilhões de anos. Não vai parar agora.',
  },
  neutrino: {
    id: 'neutrino',
    name: 'Neutrino Fugaz',
    cost: 1,
    type: 'criatura',
    faces: [
      { label: 'Fase', attack: 1, health: 1, keywords: ['fantasma'] },
      { label: 'Massa', attack: 1, health: 3, keywords: [] },
    ],
    text: 'Fase 1/1 Fantasma ⟷ Massa 1/3',
    flavor: 'Atravessou você três trilhões de vezes hoje.',
  },
  sentinela: {
    id: 'sentinela',
    name: 'Qubit Sentinela',
    cost: 2,
    type: 'criatura',
    faces: [
      { label: 'Escudo', attack: 1, health: 4, keywords: ['barreira'] },
      { label: 'Lança', attack: 3, health: 2, keywords: [] },
    ],
    text: 'Escudo 1/4 Barreira ⟷ Lança 3/2',
  },
  eletron: {
    id: 'eletron',
    name: 'Elétron Instável',
    cost: 2,
    type: 'criatura',
    faces: [
      { label: 'Excitado', attack: 3, health: 1, keywords: [] },
      { label: 'Estável', attack: 2, health: 3, keywords: [] },
    ],
    text: 'Excitado 3/1 ⟷ Estável 2/3',
  },
  gato: {
    id: 'gato',
    name: 'Gato de Schrödinger',
    cost: 3,
    type: 'criatura',
    faces: [
      { label: 'Vivo', attack: 4, health: 2, keywords: ['veloz'] },
      { label: 'Espectro', attack: 1, health: 6, keywords: ['barreira'] },
    ],
    text: 'Vivo 4/2 Veloz ⟷ Espectro 1/6 Barreira',
    flavor: 'Não abra a caixa.',
  },
  colapsador: {
    id: 'colapsador',
    name: 'Colapsador de Campo',
    cost: 4,
    type: 'criatura',
    onPlay: 'colapsarInimigo',
    faces: [
      { label: 'Detector', attack: 3, health: 4, keywords: [] },
      { label: 'Sensor', attack: 4, health: 3, keywords: [] },
    ],
    text: 'Ao entrar: colapsa uma criatura inimiga aleatória.',
  },
  ondapiloto: {
    id: 'ondapiloto',
    name: 'Onda-Piloto',
    cost: 4,
    type: 'criatura',
    faces: [
      { label: 'Crista', attack: 5, health: 3, keywords: [] },
      { label: 'Vale', attack: 3, health: 5, keywords: ['barreira'] },
    ],
    text: 'Crista 5/3 ⟷ Vale 3/5 Barreira',
  },
  quasar: {
    id: 'quasar',
    name: 'Quasar Menor',
    cost: 5,
    type: 'criatura',
    faces: [
      { label: 'Jato', attack: 6, health: 4, keywords: [] },
      { label: 'Halo', attack: 4, health: 6, keywords: [] },
    ],
    text: 'Jato 6/4 ⟷ Halo 4/6',
  },
  singularidade: {
    id: 'singularidade',
    name: 'Singularidade',
    cost: 7,
    type: 'criatura',
    faces: [
      { label: 'Horizonte', attack: 8, health: 6, keywords: ['barreira'] },
      { label: 'Núcleo', attack: 6, health: 8, keywords: ['veloz'] },
    ],
    text: 'Horizonte 8/6 Barreira ⟷ Núcleo 6/8 Veloz',
    flavor: 'Tudo que cruza o horizonte vira memória.',
  },

  medicao: {
    id: 'medicao',
    name: 'Medição',
    cost: 1,
    type: 'feitico',
    spell: 'medir',
    text: 'Colapsa qualquer criatura em um estado aleatório.',
    flavor: 'Olhar já é interferir.',
  },
  polarizacao: {
    id: 'polarizacao',
    name: 'Polarização',
    cost: 2,
    type: 'feitico',
    spell: 'polarizar',
    text: 'Colapsa uma criatura sua no estado que você escolher.',
  },
  emaranhar: {
    id: 'emaranhar',
    name: 'Emaranhamento',
    cost: 2,
    type: 'feitico',
    spell: 'emaranhar',
    text: 'Vincula uma criatura sua a uma inimiga: colapsam juntas; quando uma morre, a outra sofre 2 de dano.',
    flavor: 'Ação fantasmagórica à distância.',
  },
  tunel: {
    id: 'tunel',
    name: 'Túnel Quântico',
    cost: 2,
    type: 'feitico',
    spell: 'tunel',
    text: 'Uma criatura sua ganha Fantasma e Veloz até o fim do turno.',
  },
  pulso: {
    id: 'pulso',
    name: 'Pulso de Decaimento',
    cost: 3,
    type: 'feitico',
    spell: 'pulso',
    text: 'Causa 3 de dano a qualquer alvo. Criaturas em superposição colapsam antes.',
  },
  decoerencia: {
    id: 'decoerencia',
    name: 'Decoerência',
    cost: 5,
    type: 'feitico',
    spell: 'decoerencia',
    text: 'Colapsa todas as criaturas inimigas e causa 2 de dano a cada uma.',
    flavor: 'O universo insiste em ser clássico.',
  },
  flutuacao: {
    id: 'flutuacao',
    name: 'Flutuação do Vácuo',
    cost: 1,
    type: 'feitico',
    spell: 'flutuacao',
    text: 'Compre 2 cartas.',
    flavor: 'Do nada, tudo. Por um instante.',
  },
}

/** Lista de 20 cartas (defIds) usada pelos dois lados na v1 */
export const DECK_LIST: string[] = [
  'foton', 'foton',
  'neutrino',
  'sentinela', 'sentinela',
  'eletron', 'eletron',
  'gato', 'gato',
  'colapsador',
  'ondapiloto',
  'quasar',
  'singularidade',
  'medicao',
  'polarizacao',
  'emaranhar',
  'tunel',
  'pulso',
  'decoerencia',
  'flutuacao',
]

export function getDef(defId: string): CardDef {
  const def = CARDS[defId]
  if (!def) throw new Error(`carta desconhecida: ${defId}`)
  return def
}
