import type { DirectiveDef, DirectiveId, SecretDef, SecretId } from './types'

export const SECRETS: Record<SecretId, SecretDef> = {
  'observador-observado': {
    id: 'observador-observado',
    code: 'CT-01',
    name: 'Observador Observado',
    trigger: 'Influência inimiga bem-sucedida',
    text: 'Quando o inimigo influencia com sucesso um sujeito seu, ele perde 5 de Coerência. Uma falha não consome esta carta.',
  },
  'efeito-zeno': {
    id: 'efeito-zeno',
    code: 'CT-02',
    name: 'Efeito Zeno',
    trigger: 'Primeira morte aliada',
    text: 'O primeiro sujeito aliado que morreria permanece em campo com 1 de vida.',
  },
  'retaliacao-q88': {
    id: 'retaliacao-q88',
    code: 'CT-03',
    name: 'Retaliação Q-88',
    trigger: 'Ataque direto inimigo',
    text: 'Depois que um sujeito inimigo ataca diretamente seu Observador, ele recebe 4 de dano.',
  },
  'reacao-em-cadeia': {
    id: 'reacao-em-cadeia',
    code: 'CT-04',
    name: 'Reação em Cadeia',
    trigger: 'Oponente joga a segunda ficha no turno',
    text: 'Quando o oponente joga sua segunda ficha no mesmo turno, ele perde 4 de Coerência antes de ela resolver. Se chegar a zero, a ficha não resolve.',
  },
  'protocolo-emergencia': {
    id: 'protocolo-emergencia',
    code: 'CT-05',
    name: 'Protocolo de Emergência',
    trigger: 'Primeiro dano letal',
    text: 'O primeiro dano letal contra seu Observador o deixa com 3 de Coerência.',
  },
  'copia-carbono': {
    id: 'copia-carbono',
    code: 'CT-06',
    name: 'Cópia Carbono',
    trigger: 'Protocolo inimigo resolvido',
    text: 'Depois que o adversário resolve um Protocolo, compre 2 fichas.',
  },
  'residuo-energia': {
    id: 'residuo-energia',
    code: 'CT-07',
    name: 'Resíduo de Energia',
    trigger: 'Fim de turno com 3+ qubits',
    text: 'Quando o adversário encerra o turno com 3 ou mais qubits, ele perde 4 de Coerência.',
  },
}

export const SECRET_IDS = Object.keys(SECRETS) as SecretId[]

export const DIRECTIVES: Record<DirectiveId, DirectiveDef> = {
  'blindagem-reforcada': {
    id: 'blindagem-reforcada',
    code: 'DIR-01',
    name: 'Blindagem Reforçada',
    text: 'O Autômato inicia cada duelo com +4 de Coerência.',
  },
  'nucleo-adiantado': {
    id: 'nucleo-adiantado',
    code: 'DIR-02',
    name: 'Núcleo Adiantado',
    text: 'O Autômato inicia com +1 qubit máximo.',
  },
  'arquivo-prioritario': {
    id: 'arquivo-prioritario',
    code: 'DIR-03',
    name: 'Arquivo Prioritário',
    text: 'O Autômato recebe +1 ficha na mão inicial.',
  },
  'calibracao-hostil': {
    id: 'calibracao-hostil',
    code: 'DIR-04',
    name: 'Calibração Hostil',
    text: 'A influência do Autômato passa de 75/25 para 85/15.',
  },
  'linha-de-montagem': {
    id: 'linha-de-montagem',
    code: 'DIR-05',
    name: 'Linha de Montagem',
    text: 'O primeiro sujeito do Autômato a cada turno custa 1 qubit a menos, mínimo zero.',
  },
}

export const DIRECTIVE_IDS = Object.keys(DIRECTIVES) as DirectiveId[]

export function getSecret(id: SecretId): SecretDef {
  return SECRETS[id]
}

export function getDirective(id: DirectiveId): DirectiveDef {
  return DIRECTIVES[id]
}
