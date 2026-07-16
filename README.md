# COLAPSO · Instituto Meia-Vida

> Um duelo de cartas onde **nada está decidido até alguém olhar**.

COLAPSO é um card game single-player para web e iOS ambientado no Instituto Meia-Vida, um
laboratório dos anos 1950 que cataloga entidades quânticas. Toda noite, um Observador humano
(você) e o Autômato da casa disputam a custódia dos sujeitos do arquivo — criaturas que são duas
coisas ao mesmo tempo até serem observadas. Observar é interferir; interferir é vencer.

**Jogo 100% local**: sem backend, conta ou analytics. Web e nativo compartilham regras, cartas,
IA, Contramedidas, Diretrizes e fluxo de Plantão; cada interface apresenta o mesmo jogo com
interações próprias para mouse ou toque.

## Como rodar

Requer Node `20.19.4` ou mais recente. O arquivo `.nvmrc` mantém a versão usada pelo projeto.

```bash
nvm use
npm install

npm run dev:web       # Vite em http://localhost:5173
npm run dev:native    # Metro em localhost para o simulador
npm run dev:native:device # Metro em LAN para iPad/iPhone físicos
npm run ios:native    # compila e instala no simulador/dispositivo iOS
npm run ios:native:device # escolhe um iPad/iPhone físico para instalar

npm run typecheck
npm test              # web, core, sessão e componentes nativos
npm run build         # produção web em apps/web/dist/
npm run export:native # bundle iOS em apps/native/dist-ios/
```

A versão nativa usa development build; Expo Go não contém todos os módulos necessários.

## A mecânica-assinatura: superposição

Cada ficha de sujeito tem **dois estados** — a linha **A** (vermelha) e a linha **B** (azul) —
com ataque, vida e habilidades próprios:

> **O Gato** · Sujeito nº 13 — `A · Vivo · 4/2 · Oscilação` ⟷ `B · Espectro · 1/6 · Barreira`

- **Superposição** — em campo, o sujeito é os dois estados ao mesmo tempo (e não tem
  palavra-chave nenhuma). As duas linhas pulsam na ficha.
- **Colapso** — ao atacar ou ser atacado, um carimbo `OBSERVADO` sorteia um dos dois estados
  (50/50). Normalmente ele permanece ativo; Oscilação é a exceção. Medição garante o estado de
  qualquer Sujeito por 3 Qubits; Polarização faz o mesmo em um Sujeito próprio por 2.
- **Emaranhamento** — um barbante vermelho liga um sujeito seu a um inimigo: colapsam juntos
  (A com A, B com B) e, quando um morre, o outro sofre 2 de dano de eco.
- **Observar** — poder de herói (2 qubits, 1x/turno): escolha A ou B para qualquer sujeito. A
  influência favorece sua escolha em 75/25; a IA pode chegar a 85/15 por Diretriz.

## Plantão contínuo

Cada tentativa possui três setores e o **Autômato Supervisor** como chefe. Você começa escolhendo
uma de três Contramedidas, cartas especiais que entram armadas gratuitamente e disparam uma vez
por duelo. A carta inimiga permanece confidencial até o gatilho; depois de revelada, continua no
painel e pode ser consultada novamente.

Após cada vitória regular, uma Diretriz cumulativa fortalece a IA e uma nova Contramedida é
adicionada ao seu arsenal. Apenas uma pode ser equipada por duelo. O chefe começa com 30 de
Coerência e duas Contramedidas diferentes, armadas em sequência. Uma derrota reinicia todo o
Plantão; nenhuma progressão é gravada.

## Regras em 30 segundos

| Conceito | Regra |
|---|---|
| Objetivo | Zerar a **Coerência** do Autômato: 25 nos setores e 30 no Supervisor, antes de Diretrizes |
| Energia | **Qubits**: começam em 2, depois ganham +1 de máximo por turno (até 8) |
| Compra | **Refil**: no início do turno, compre até ter 5 fichas (mínimo 1) |
| Arquivo | Deck de 20; quando esvazia, o **descarte volta embaralhado** — nunca há turno morto |
| Campo | Até 6 sujeitos por lado; cada um ataca 1x por turno |
| Mão | Até 8 fichas; compras excedentes são enviadas ao descarte |
| Observar | 2 Qubits, 1x por turno: escolha A/B de qualquer Sujeito em 75/25 |
| Palavras-chave | **Barreira** (atacado primeiro) · **Oscilação** (troca de estado após atacar e sobreviver) · **Fantasma** (ignora Barreira e concede Intangível temporário) |

## Controles

- **Web:** clique numa ficha da mão para jogar; clique num sujeito e depois no alvo para atacar;
  `Esc` cancela a seleção.
- **Nativo:** toque numa ficha para ampliá-la e confirme em **Jogar ficha**; toque num sujeito
  elegível e depois somente em um alvo destacado.
- O painel inimigo vira o alvo de ataque direto durante a mira e nunca abre informações nesse
  momento.
- A mão nativa é retrátil. Manual, palavras-chave, painéis e Contramedidas usam ações explícitas
  de consulta — não existem tooltips ou cursor virtual.

## O jogo ensina jogando

- **Memorandos do Supervisor** — na primeira vez que cada mecânica acontece, um memo explica na
  hora; a preferência usa `localStorage` no web e AsyncStorage no nativo.
- **Consulta contextual** — tooltips no web e inspetores explícitos no nativo explicam palavras-
  chave, custos, Qubits, Coerência e arquivos.
- **Manual do Observador** — regras completas a um clique, no título e em jogo

## O elenco do arquivo

| Sujeito | Ficha | Estados |
|---|---|---|
| **Fóton** | O Estafeta · nº 01 | Raio 2/1 Oscilação ⟷ Brilho 1/2 |
| **Neutrina** | A Intangível · nº 02 | Fase 1/1 Fantasma ⟷ Massa 1/3 |
| **Sentinela Q-88** | Segurança do Arquivo | Escudo 1/4 Barreira ⟷ Lança 3/2 |
| **Elétron** | O Inquieto · nº 03 | Excitado 3/1 ⟷ Estável 2/3 |
| **O Gato** | Sujeito nº 13 · não abra a caixa | Vivo 4/2 Oscilação ⟷ Espectro 1/6 Barreira |
| **O Auditor** | Fiscal de Realidades | Vistoria 3/4 ⟷ Autuação 4/3 · colapsa um inimigo ao entrar |
| **Madame Onda** | Regente do Salão de Interferência | Crista 5/3 ⟷ Vale 3/5 Barreira |
| **Quasar** | O Farol · nº 07 | Jato 6/4 ⟷ Halo 4/6 |
| **A Fome** | Sujeito nº 00 · contenção máxima | Horizonte 8/6 Barreira ⟷ Núcleo 6/8 Oscilação |

Mais 7 **Protocolos**: Medição, Polarização, Emaranhamento, Túnel Quântico, Pulso de Decaimento,
Decoerência e Requisição. Custos, alvos e ordem de resolução estão em [RULES.md](RULES.md).

## Stack e arquitetura

**React 19 · TypeScript · Vite · Expo SDK 55 · React Native · Reanimated · Vitest · Jest**

```text
apps/
├── web/                 # interface Vite existente, mouse e toque responsivo
└── native/              # Expo iOS/Android, paisagem e interaction design nativo
packages/
├── game-core/           # regras puras, cartas, IA, Plantão e RandomSource injetável
├── game-session/        # GameCommand, seleção, fila PresentationCue e checkpoint
└── game-assets/         # retratos WebP compartilhados pelas duas interfaces
tools/
└── generate-native-sfx.mjs
```

O motor não depende de DOM, WebAudio, coordenadas ou temporizadores visuais. No nativo, cada
animação bloqueante confirma sua conclusão com `ACK_PRESENTATION`; a sessão nunca pressupõe uma
duração fixa. O web preserva seu adaptador visual e compartilha com a sessão a política de alvos.

### Retomada do Plantão no nativo

No começo de cada setor, um `RunCheckpoint` versionado guarda arsenal, Diretrizes e
Contramedida. Se o app for fechado durante o duelo, ele reabre no briefing e reinicia somente
aquele confronto. Vitória final, derrota ou um novo Plantão apagam o checkpoint.

## Documentação

- [RULES.md](RULES.md) — regras canônicas, custos, efeitos e ordem de resolução.
- [PRODUCT.md](PRODUCT.md) — visão do produto, pilares, escopo e metas de playtest.
- [DESIGN.md](DESIGN.md) — linguagem visual, componentes, motion e responsividade.

## Roteiro

- [ ] Mais fichas e arquétipos de deck
- [ ] Balanceamento fino (winrate do Autômato)
- [ ] Deckbuilding
- [ ] PvP online

---

*Instituto Meia-Vida · Divisão de Observação · circular interna nº 7: leia antes de tocar em
qualquer coisa.*
