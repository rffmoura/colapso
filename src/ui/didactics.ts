/** Memorandos do Supervisor: ensinam cada mecânica na primeira vez que ela acontece. */

export interface Memo {
  id: string
  title: string
  text: string
}

export const MEMOS: Record<string, Memo> = {
  inicio: {
    id: 'inicio',
    title: 'Bem-vindo ao plantão',
    text: 'Sua missão: zerar a Coerência do Autômato antes que ele zere a sua. Jogue fichas pagando Qubits (as bolinhas amarelas do seu crachá). Clique numa ficha da mão para jogá-la.',
  },
  superposicao: {
    id: 'superposicao',
    title: 'Superposição',
    text: 'Este sujeito está nos DOIS estados ao mesmo tempo — as linhas A e B da ficha. Ele só se decide quando alguém observa: ao atacar, ser atacado ou ser medido.',
  },
  colapso: {
    id: 'colapso',
    title: 'Colapso',
    text: 'Observado! O carimbo sorteou um estado e agora ele é definitivo. Colapsar os seus na hora certa — e os do inimigo na errada — é o coração do jogo.',
  },
  observar: {
    id: 'observar',
    title: 'Poder: Observar',
    text: 'Com 2 qubits, o botão roxo do seu crachá colapsa QUALQUER sujeito, uma vez por turno. Tire a dúvida do inimigo antes que ela vire um problema.',
  },
  barreira: {
    id: 'barreira',
    title: 'Barreira',
    text: 'Sujeitos com BARREIRA precisam ser atacados primeiro. Atenção: a palavra-chave só vale depois do colapso — em superposição, ninguém protege ninguém.',
  },
  emaranhamento: {
    id: 'emaranhamento',
    title: 'Emaranhamento',
    text: 'O barbante vermelho liga dois sujeitos: quando um colapsa, o outro colapsa junto (no mesmo estado). Quando um morre, o outro sofre 2 de dano de eco.',
  },
  refil: {
    id: 'refil',
    title: 'Refil do arquivo',
    text: 'Todo turno você compra até ficar com 5 fichas. Quando o arquivo esvazia, o descarte volta embaralhado — nunca existe turno morto. Gaste sem medo.',
  },
}

const STORAGE_KEY = 'colapso-memos-v2'

export function loadSeenMemos(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

export function persistSeenMemos(seen: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]))
  } catch {
    /* modo anônimo: dicas repetem, sem drama */
  }
}
