# COLAPSO · Instituto Meia-Vida

> Um duelo de cartas onde **nada está decidido até alguém olhar**.

COLAPSO é um card game web single-player ambientado no Instituto Meia-Vida, um laboratório dos
anos 1950 que cataloga entidades quânticas. Toda noite, um Observador humano (você) e o Autômato
da casa disputam a custódia dos sujeitos do arquivo — criaturas que são duas coisas ao mesmo
tempo até serem observadas. Observar é interferir; interferir é vencer.

**Jogo 100% front-end**: sem backend, sem assets externos. Arte vetorial autoral, sons
sintetizados em tempo real e visual de papel impresso dos anos 50.

## Como rodar

```bash
npm install
npm run dev      # desenvolvimento (Vite, http://localhost:5173)
npm test         # suíte determinística do motor
npm run build    # build de produção em dist/
```

## A mecânica-assinatura: superposição

Cada ficha de sujeito tem **dois estados** — a linha **A** (vermelha) e a linha **B** (azul) —
com ataque, vida e habilidades próprios:

> **O Gato** · Sujeito nº 13 — `A · Vivo · 4/2 · Veloz` ⟷ `B · Espectro · 1/6 · Barreira`

- **Superposição** — em campo, o sujeito é os dois estados ao mesmo tempo (e não tem
  palavra-chave nenhuma). As duas linhas pulsam na ficha.
- **Colapso** — ao atacar ou ser atacado, um carimbo `OBSERVADO` sorteia um dos dois estados
  (50/50). Para sempre. O Protocolo Medição permite escolher o estado de qualquer sujeito.
- **Emaranhamento** — um barbante vermelho liga um sujeito seu a um inimigo: colapsam juntos
  (A com A, B com B) e, quando um morre, o outro sofre 2 de dano de eco.
- **Observar** — poder de herói (2 qubits, 1x/turno): escolha A ou B para qualquer sujeito. A
  influência favorece sua escolha em 75/25; a IA pode chegar a 85/15 por Diretriz.

## Plantão contínuo

Cada tentativa possui três setores e o **Autômato Supervisor** como chefe. Você começa escolhendo
uma de três Contramedidas, cartas especiais que entram armadas gratuitamente e disparam uma vez
por duelo. A carta inimiga permanece confidencial até o gatilho.

Após cada vitória regular, uma Diretriz cumulativa fortalece a IA e uma nova Contramedida é
adicionada ao seu arsenal. Apenas uma pode ser equipada por duelo. O chefe começa com 30 de
Coerência e duas Contramedidas diferentes, armadas em sequência. Uma derrota reinicia todo o
Plantão; nenhuma progressão é gravada.

## Regras em 30 segundos

| Conceito | Regra |
|---|---|
| Objetivo | Zerar a **Coerência** (25) do Autômato |
| Energia | **Qubits**: +1 de máximo por turno (até 8), recarregam todo turno |
| Compra | **Refil**: no início do turno, compre até ter 5 fichas (mínimo 1) |
| Arquivo | Deck de 20; quando esvazia, o **descarte volta embaralhado** — nunca há turno morto |
| Campo | Até 6 sujeitos por lado; cada um ataca 1x por turno |
| Palavras-chave | **Barreira** (atacado primeiro) · **Veloz** (ataca ao entrar) · **Fantasma** (ignora Barreira e concede Intangível até o próximo turno) |

## Controles

- **Clique** numa ficha da mão para jogá-la (protocolos com alvo entram em modo de mira)
- **Clique** num sujeito seu e depois no alvo para atacar
- **Esc** ou clique no fundo cancela a seleção
- **?** abre o Manual do Observador · **S** silencia o som

## O jogo ensina jogando

- **Memorandos do Supervisor** — na primeira vez que cada mecânica acontece, um memo explica na
  hora (persistido em `localStorage`; "Já sei jogar" desativa todos)
- **Tooltips** — palavras-chave, custos, qubits, coerência e pilhas se explicam no hover
- **Manual do Observador** — regras completas a um clique, no título e em jogo

## O elenco do arquivo

| Sujeito | Ficha | Estados |
|---|---|---|
| **Fóton** | O Estafeta · nº 01 | Raio 2/1 Veloz ⟷ Brilho 1/2 |
| **Neutrina** | A Intangível · nº 02 | Fase 1/1 Fantasma ⟷ Massa 1/3 |
| **Sentinela Q-88** | Segurança do Arquivo | Escudo 1/4 Barreira ⟷ Lança 3/2 |
| **Elétron** | O Inquieto · nº 03 | Excitado 3/1 ⟷ Estável 2/3 |
| **O Gato** | Sujeito nº 13 · não abra a caixa | Vivo 4/2 Veloz ⟷ Espectro 1/6 Barreira |
| **O Auditor** | Fiscal de Realidades | Vistoria 3/4 ⟷ Autuação 4/3 · colapsa um inimigo ao entrar |
| **Madame Onda** | Regente do Salão de Interferência | Crista 5/3 ⟷ Vale 3/5 Barreira |
| **Quasar** | O Farol · nº 07 | Jato 6/4 ⟷ Halo 4/6 |
| **A Fome** | Sujeito nº 00 · contenção máxima | Horizonte 8/6 Barreira ⟷ Núcleo 6/8 Veloz |

Mais 7 **Protocolos** (feitiços): Medição, Polarização, Emaranhamento, Túnel Quântico, Pulso de
Decaimento, Decoerência e Requisição.

## Stack e arquitetura

**Vite · React 19 · TypeScript · Motion · Vitest**

```
src/
├── engine/          # regras puras, sem UI
│   ├── types.ts     # tipos e constantes do jogo
│   ├── cards.ts     # as 16 fichas do arquivo
│   ├── secrets.ts   # Contramedidas e Diretrizes
│   ├── run.ts       # draft, arsenal e sequência de quatro duelos
│   ├── game.ts      # primitivas imutáveis (colapso, combate, compra...)
│   └── ai.ts        # heurísticas do Autômato
├── state/
│   └── store.ts     # orquestrador: sequencia turnos, animações e sons
├── ui/
│   ├── characters.tsx   # personagens em SVG artesanal (com idle animations)
│   ├── CardView.tsx     # anatomia da ficha de catálogo
│   ├── GameBoard.tsx    # a bancada do Instituto
│   ├── Piles.tsx        # pilhas de arquivo/descarte + fantasmas de compra
│   ├── didactics.ts     # memorandos do Supervisor
│   └── ...
└── audio/
    └── sfx.ts       # efeitos sonoros sintetizados via WebAudio
```

Detalhes de produto e direção de arte em [PRODUCT.md](PRODUCT.md) e [DESIGN.md](DESIGN.md).

## Roteiro

- [ ] Mais fichas e arquétipos de deck
- [ ] Balanceamento fino (winrate do Autômato)
- [ ] Deckbuilding
- [ ] PvP online

---

*Instituto Meia-Vida · Divisão de Observação · circular interna nº 7: leia antes de tocar em
qualquer coisa.*
