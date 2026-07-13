# COLAPSO — um duelo quântico

Jogo de cartas web single-player (você contra a IA) onde **nada está decidido até alguém olhar**.

## Como rodar

```bash
npm install
npm run dev
```

Abra o endereço que o Vite indicar (por padrão `http://localhost:5173`).

## Regras

- Cada jogador começa com **25 de Coerência** (vida) e um deck de 20 cartas. Reduza a Coerência do oponente a zero.
- **Qubits** são a energia: você ganha 1 de máximo por turno (até 8) e eles recarregam a cada turno.
- **Superposição**: toda criatura entra em jogo com *dois estados possíveis* (ex.: Gato de Schrödinger é `Vivo 4/2 Veloz` ⟷ `Espectro 1/6 Barreira`). Enquanto superposta, ela não tem palavras-chave e seus atributos são indefinidos.
- **Colapso**: ao atacar, ser atacada ou ser alvo de medição, a criatura colapsa num único estado (50/50) — para sempre.
- **Emaranhamento**: vincula uma criatura sua a uma inimiga. Quando uma colapsa, a outra colapsa junto (mesmo estado); quando uma morre, a outra sofre 2 de dano de eco.
- **Poder de herói — Observar (2 qubits)**: colapsa qualquer criatura, uma vez por turno.
- Palavras-chave: **Barreira** (inimigos devem atacá-la primeiro), **Veloz** (ataca no turno em que entra), **Fantasma** (ignora Barreira).

## Controles

- Clique numa carta da mão para jogá-la (feitiços com alvo entram em modo de mira).
- Clique numa criatura sua e depois no alvo para atacar. `Esc` ou clique no fundo cancela.

## Stack

Vite + React 19 + TypeScript + Motion (Framer Motion). Sem backend; sons sintetizados via WebAudio, arte das cartas 100% procedural (SVG).

- Motor de regras puro em `src/engine/` (tipos, cartas, lógica, IA)
- Orquestração de animações e turnos em `src/state/store.ts`
- Componentes visuais em `src/ui/`
