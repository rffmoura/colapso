# COLAPSO — Instituto Meia-Vida

Jogo de cartas web single-player (você contra o Autômato) ambientado num laboratório dos anos
1950 que cataloga entidades quânticas. **Nada está decidido até alguém olhar.**

## Como rodar

```bash
npm install
npm run dev
```

Abra o endereço que o Vite indicar (por padrão `http://localhost:5173`).

## Regras

- Cada lado começa com **25 de Coerência**. Zere a do oponente.
- **Qubits** são a energia: +1 de máximo por turno (até 8), recarregam inteiros a cada turno.
- **Refil de mão**: no início do seu turno você compra até ficar com 5 fichas (sempre ao menos 1).
  Quando o arquivo (deck) esvazia, o **descarte volta embaralhado** — nunca há turno morto.
- **Superposição**: todo sujeito tem dois estados (linha A vermelha e linha B azul), com ataque,
  vida e palavras-chave próprios. Em superposição ele não tem palavra-chave nenhuma.
- **Colapso**: ao atacar, ser atacado ou medido, o sujeito colapsa num único estado (50/50),
  carimbado para sempre.
- **Emaranhamento**: barbante vermelho entre um sujeito seu e um inimigo — colapsam juntos
  (mesmo estado) e, quando um morre, o outro sofre 2 de dano de eco.
- **Poder Observar (2 qubits, 1x/turno)**: colapsa qualquer sujeito.
- Palavras-chave: **Barreira** (precisa ser atacado primeiro), **Veloz** (ataca no turno em que
  entra), **Fantasma** (ignora Barreira).

## Didática embutida

- **Memorandos do Supervisor**: a primeira vez que cada mecânica acontece, um memo explica na hora
  (persistido em localStorage; "Já sei jogar" desativa todos).
- **Tooltips**: palavras-chave, custo, qubits, coerência e arquivo explicam-se ao passar o mouse.
- **Manual do Observador**: botão "?" (em jogo) ou na tela de título.

## Elenco

O Gato (Sujeito nº 13), Fóton o Estafeta, Neutrina a Intangível, Sentinela Q-88, Elétron o
Inquieto, O Auditor, Madame Onda, Quasar o Farol e A Fome — cada um com ilustração vetorial
própria e animação idle. Protocolos são os feitiços do Instituto.

## Stack

Vite + React 19 + TypeScript + Motion. Sem backend e sem assets externos: arte 100% SVG artesanal,
sons sintetizados via WebAudio, texturas de papel geradas em CSS/SVG.

- Motor de regras puro em `src/engine/` (tipos, fichas, lógica, IA)
- Orquestração de turnos/animações em `src/state/store.ts`
- Personagens em `src/ui/characters.tsx`; memos/manual em `src/ui/didactics.ts`
