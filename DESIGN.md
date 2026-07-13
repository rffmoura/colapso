# DESIGN.md — Colapso

## Estratégia de cor: Full palette (dualidade mecânica)

A paleta É a mecânica. Cada papel de cor tem significado de regra:

| Papel | OKLCH | Uso |
|---|---|---|
| Vazio (fundo) | `oklch(0.14 0.02 300)` | fundo do cosmos; nunca #000 |
| Vazio elevado | `oklch(0.19 0.025 300)` | painéis, verso de carta |
| Partícula (estado A) | `oklch(0.78 0.16 70)` âmbar | face A das cartas, dano físico |
| Onda (estado B) | `oklch(0.80 0.13 220)` azul-gelo | face B das cartas |
| Emaranhamento | `oklch(0.70 0.20 320)` violeta-magenta | linhas de vínculo, feitiços de vínculo |
| Coerência (vida) | `oklch(0.75 0.15 150)` verde-água | HP, cura |
| Colapso (flash) | `oklch(0.97 0.05 90)` branco-quente | flashes de medição, partículas |
| Texto | `oklch(0.93 0.01 300)` | texto primário |
| Texto secundário | `oklch(0.62 0.02 300)` | rótulos, custos apagados |

Superposição = gradiente/cintilação âmbar↔azul-gelo. Nunca usar as duas cores juntas fora desse significado.

## Tema

Escuro, justificado pela cena: jogador casual à noite, quarto escuro, tela é a única fonte de luz; efeitos de partícula e glow precisam de fundo escuro para ter luminância percebida. Não é "dark porque é sci-fi".

## Tipografia

- **Display: Unbounded** (títulos, nome do jogo, banner de turno, nomes de carta) — cerimonial e cósmica sem figurino sci-fi.
- **Corpo/UI: Sora** (texto de regra, rótulos, números de atributo) — precisa, geométrica, ótima em corpos pequenos.
- Escala com ratio ≥1.25; números de atributo em peso 800.

## Layout

Tabuleiro em três faixas horizontais: mão/painel da IA (topo, compacta), campo de batalha (centro, dominante), mão do jogador (baixo, em leque). Painéis de herói nos cantos esquerdos das faixas. Sem cards-de-UI aninhados; o campo é espaço aberto sobre o cosmos.

## Motion (assinaturas)

- **Superposição**: a carta cintila entre as duas faces (crossfade lento + leve deriva cromática âmbar/azul). Nunca parada.
- **Colapso**: oscilação acelera → flash branco-quente → explosão de partículas → snap na face final com scale spring.
- **Ataque**: anticipation (recuo) → investida → shake no alvo + burst radial + número de dano flutuante.
- **Emaranhamento**: linha bezier SVG violeta pulsante entre as cartas.
- **Jogar carta**: voo da mão ao slot com spring; layout animation nos slots.
- Easings: ease-out-quart/expo; springs para snaps. Sem bounce/elastic decorativo. Nunca animar propriedades de layout CSS (usar transform).

## Bans do projeto

Orbitron/Michroma e afins; neon ciano sobre #000; glassmorphism decorativo; gradiente em texto; mesa de madeira/feltro skeuomórfico; modais para escolhas de jogo (escolhas acontecem inline no tabuleiro).
