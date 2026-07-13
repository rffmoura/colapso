# DESIGN.md — COLAPSO v2 · "Instituto Meia-Vida"

## Direção

Era atômica, anos 1950. O jogo é a mesa de trabalho de um Observador do Instituto Meia-Vida:
papel creme, tinta quente, carimbos, fichas de catálogo de sujeitos experimentais. Zero cosmos,
zero neon. Impressão serigráfica: cores chapadas, registro levemente desalinhado, grain de papel.

## Estratégia de cor: Full palette (tinta sobre papel)

| Papel | OKLCH | Uso |
|---|---|---|
| Papel | `oklch(0.94 0.02 90)` | fundo geral (bancada) |
| Papel-ficha | `oklch(0.97 0.015 95)` | corpo das cartas |
| Papel-sombra | `oklch(0.88 0.025 88)` | zonas, painéis rebaixados |
| Tinta | `oklch(0.25 0.02 60)` | texto, contornos, carimbo de turno |
| Tinta fraca | `oklch(0.48 0.02 70)` | texto secundário, pautas |
| Partícula (estado A) | `oklch(0.58 0.19 33)` vermelho-tomate | face A, dano, carimbos de alerta |
| Onda (estado B) | `oklch(0.55 0.1 205)` teal | face B, água/calma |
| Energia | `oklch(0.78 0.14 85)` mostarda | qubits, custo, destaques |
| Emaranhamento | `oklch(0.5 0.16 310)` roxo atômico | barbante de evidências, protocolos |
| Aprovado | `oklch(0.55 0.12 150)` verde-selo | coerência, cura, vitória |

Dualidade mecânica preservada: **Partícula = vermelho-tomate, Onda = teal**; superposição = os
dois carimbos convivendo na ficha. Roxo é exclusivo do emaranhamento/protocolos.

## Tema

Claro (papel iluminado de escrivaninha). Cena: o jogador é um funcionário noturno sob a luz de
uma luminária de mesa; a mesa é quente, o resto da sala escurece nas bordas (vinheta suave).

## Tipografia

- **Display: Archivo Black** — pôster atômico, títulos, números de atributo, carimbos.
- **Máquina de escrever: Special Elite** — rótulos de ficha, texto de regra, memos do Supervisor.
- **Corpo/UI: Archivo** (400/600/700) — controles e textos utilitários.
- Escala ≥1.25; números de stats grandes e chapados.

## Anatomia da carta (ficha de catálogo)

1. Cabeçalho: faixa de tinta com **nome completo legível** (nada sobrepõe o nome).
2. Selo de custo: círculo mostarda no canto superior direito, DENTRO da carta.
3. Janela de arte: personagem vetorial sobre fundo de cor da carta, moldura de tinta.
4. Bloco de estados: duas linhas legíveis `A · Vivo · 4/2 · Veloz` / `B · Espectro · 1/6 · Barreira`
   (a linha ativa acende após o colapso; antes, as duas pulsam alternando).
5. Rodapé: número de série da ficha + tipo (SUJEITO / PROTOCOLO).

## Motion (assinaturas v2)

- **Colapso** = carimbo `OBSERVADO` que desce com slam, tremor de papel e respingos de tinta;
  a linha do estado sorteado acende.
- **Emaranhamento** = barbante vermelho de mural de evidências entre as fichas, com leve balanço.
- **Ataque** = a ficha desliza com tilt e slam; impacto com burst de tinta e shake curto do tabuleiro.
- **Turno** = tarja de telegrama atravessa a tela (`SEU PLANTÃO · TURNO 3`).
- **Fim de jogo** = RELATÓRIO FINAL com carimbo `APROVADO` (vitória) ou `ARQUIVADO` (derrota).
- **Idle dos personagens**: piscar de olhos, cauda do Gato, antena da Sentinela (CSS keyframes).
- Easings ease-out-quart/expo; springs nos slams. Transform-only.

## Bans do projeto (v2)

Cosmos/neon/starfield; glassmorphism; gradiente em texto; Orbitron e afins; sombras difusas
"suaves de SaaS" (sombras aqui são duras, deslocadas, de impressão); emoji na UI.
