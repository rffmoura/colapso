# DESIGN.md — COLAPSO · Instituto Meia-Vida

## Direção

Era atômica, anos 1950. O jogo é a mesa de trabalho de um Observador do Instituto Meia-Vida:
papel creme, tinta quente, carimbos, fichas de catálogo, formulários de segurança e retratos de
Sujeitos experimentais.

A interface deve parecer um sistema burocrático físico que ganhou movimento — nunca uma HUD
futurista. Impressão serigráfica, cores chapadas, registro levemente desalinhado, bordas de tinta
e grão de papel formam a linguagem base.

## Estratégia de cor: tinta sobre papel

| Papel ou tinta | OKLCH | Uso |
|---|---|---|
| Papel | `oklch(0.94 0.02 90)` | Bancada e fundo geral. |
| Papel-ficha | `oklch(0.97 0.015 95)` | Cartas, documentos e superfícies elevadas. |
| Papel-sombra | `oklch(0.88 0.025 88)` | Zonas, painéis rebaixados e estados consumidos. |
| Tinta | `oklch(0.25 0.02 60)` | Texto, contornos, títulos e carimbos neutros. |
| Tinta fraca | `oklch(0.48 0.02 70)` | Texto secundário, pautas e metadados. |
| Partícula, estado A | `oklch(0.58 0.19 33)` | Face A, dano, alertas e hostilidade. |
| Onda, estado B | `oklch(0.55 0.1 205)` | Face B, foco, seleção e identidade do Observador. |
| Energia | `oklch(0.78 0.14 85)` | Qubits, custos e destaques operacionais. |
| Emaranhamento | `oklch(0.5 0.16 310)` | Vínculos, Protocolos e Intangível. |
| Aprovado | `oklch(0.55 0.12 150)` | Coerência, Contramedida aliada e vitória. |

Partícula e Onda devem continuar exclusivos da leitura A/B. Roxo pode representar fenômenos que
rompem a interação normal — Emaranhamento, Protocolos e Intangível. Verde identifica proteção
conhecida e resultado aprovado; vermelho identifica sigilo hostil e risco.

## Cena e profundidade

O tema é claro, como uma escrivaninha sob uma luminária durante o turno da noite. O centro da
mesa é quente e legível; as bordas podem escurecer com uma vinheta discreta.

Profundidade vem de papel sobre papel, sombras duras deslocadas, inclinações mínimas e pequenos
erros de impressão. Evitar blur decorativo e superfícies translúcidas.

## Tipografia

- **Display: Archivo Black** — pôster atômico, títulos, números de atributo e carimbos.
- **Máquina de escrever: Special Elite** — regras, fichas, memorandos, códigos e documentos.
- **Corpo/UI: Archivo** (400/600/700) — controles e textos utilitários.
- Números de Vida, Coerência e Qubits devem ser reconhecíveis antes dos rótulos.
- Textos confidenciais e carimbos podem usar caixa alta; explicações longas não.
- Nenhum nome de carta, estado, gatilho ou botão pode depender de texto truncado para caber.

## Sujeitos: ficha de catálogo

1. Cabeçalho com nome completo e legível; nada deve sobrepor o nome.
2. Selo de custo mostarda dentro da carta.
3. Janela de arte com retrato ilustrado em WebP, enquadrado para preservar o rosto na mão e na
   mesa.
4. Duas linhas de estado: `A · Vivo · 4/2 · Oscilação` e `B · Espectro · 1/6 · Barreira`.
5. Antes do colapso, A e B pulsam alternadamente; depois, apenas a linha ativa recebe ênfase.
6. Vida atual aparece como selo separado e nunca substitui silenciosamente a Vida impressa.
7. Rodapé contém identificação e tipo documental da ficha.

Palavras-chave continuam interativas na mesa. O mesmo tooltip disponível na mão deve permanecer
consultável depois que o Sujeito for jogado.

## Protocolos: pranchas técnicas

Protocolos compartilham a moldura de catálogo, mas usam ilustrações vetoriais de diagramas,
instrumentos e formulários do Instituto. A arte deve comunicar a ação — medir, polarizar,
emaranhar, atravessar, decair, descoerir ou requisitar — sem depender de ícones sci-fi genéricos.

Quando o Protocolo exige alvo ou escolha A/B, a mesa deve entrar em um modo de decisão explícito.
Medição e Polarização usam a mesma linguagem inline de estados, mas Medição precisa parecer mais
abrangente por aceitar qualquer Sujeito.

## Fantasma e Intangível

Fantasma permanece uma palavra-chave impressa na linha do estado. A proteção temporária deve ser
mostrada separadamente como o selo **INTANGÍVEL**, em roxo, para não sugerir que o Sujeito ficará
imune para sempre.

- O selo precisa caber nas cartas da mesa em todas as larguras responsivas sem cobrir retrato,
  Vida ou estados.
- O tooltip explica duração e exceções: ataques não podem mirar; Protocolos e revides ainda causam
  dano.
- Ao tentar selecionar um alvo Intangível, o feedback deve ocorrer no próprio Sujeito.

## Contramedidas

Contramedidas são fichas de segurança, visualmente distintas dos Sujeitos e Protocolos:

- **Aliada armada:** papel claro, código CT, selo verde e nome visível.
- **Inimiga confidencial:** papel escuro, lacre vermelho, código `CT-??` e texto sob sigilo.
- **Disparo:** a carta é revelada em primeiro plano por tempo suficiente para ser percebida, sem
  depender dessa aparição para leitura posterior.
- **Utilizada:** permanece no slot com carimbo de consumo e pode ser aberta novamente.
- **Reserva do Supervisor:** comunica quantidade, nunca identidade; a segunda carta só aparece
  como ativa após o primeiro disparo.

O slot de Contramedida pertence ao painel de cada Observador. Cartas próprias armadas e cartas já
reveladas funcionam como botões e abrem um inspetor com nome, gatilho, efeito e status. O histórico
do Supervisor deve permitir consultar todos os registros revelados.

## Diretrizes e Plantão contínuo

As telas entre duelos são pastas e ordens de serviço, não menus abstratos:

- **Escolha inicial:** três fichas de Contramedida com efeito completo e uma ação clara.
- **Briefing:** setor atual, trilha de quatro duelos, Coerência inimiga, número de ameaças ocultas,
  Contramedida equipada e todas as Diretrizes cumulativas.
- **Recompensa:** nova Diretriz apresentada antes da escolha entre três Contramedidas inéditas.
- **Arsenal:** todas as cartas adquiridas, com apenas uma equipável para o duelo seguinte.
- **Derrota ou vitória final:** relatório físico com carimbo e consequência explícita.

Diretrizes usam bilhetes administrativos com código `DIR`, título e regra escrita. Nunca esconder
um modificador de dificuldade apenas em cor ou ícone.

## Painéis do Observador e do Autômato

Os dois painéis compartilham a mesma estrutura para facilitar comparação:

- identidade e código funcional;
- Coerência como número dominante;
- Qubits atuais/máximos;
- quantidade de fichas na mão;
- poder Observar apenas no painel do jogador;
- slot de Contramedida no mesmo eixo visual.

O painel do jogador usa teal como identificação; o do Autômato usa vermelho. Tooltips próximos às
bordas devem inverter sua direção para nunca serem cortados pela viewport.

## Motion

- **Colapso:** carimbo `OBSERVADO`, slam curto, tremor de papel e ativação da linha escolhida.
- **Oscilação:** comprovante de troca A→B ou B→A sobre a ficha, acompanhado por dois tons
  cruzados; a nova linha ativa precisa ficar evidente sem sugerir um novo colapso.
- **Observar:** escolha A/B permanece legível durante toda a decisão; o resultado mostra 75% ou o
  desvio de 25%.
- **Emaranhamento:** barbante de mural entre as fichas, com balanço discreto.
- **Ataque:** deslocamento com tilt, impacto seco e shake curto do tabuleiro.
- **Contramedida:** revelação semelhante à abertura de um documento lacrado; depois volta ao slot
  como registro utilizado. Se causar dano, a revelação antecede o impacto, o som e o número
  flutuante sobre o alvo.
- **Protocolo hostil:** a ficha usada pelo Autômato é interceptada brevemente antes de seu efeito;
  nenhum dano ou alteração da mesa deve parecer sem origem.
- **Turno:** tarja de telegrama (`SEU PLANTÃO · TURNO 3`).
- **Plantão:** pastas entram como documentos protocolados, com movimentos curtos e físicos.
- **Fim:** relatório com `PLANTÃO CUMPRIDO` ou `ARQUIVO REINICIADO`.
- **Idle:** piscar, cauda, antena e outros movimentos pequenos que não prejudiquem a leitura.

Usar preferencialmente transform e opacity, easings ease-out-quart/expo e springs apenas nos
slams. Respeitar `prefers-reduced-motion`; nenhuma informação pode depender exclusivamente de
animação.

## Responsividade e acessibilidade

- Desktop organiza a mesa horizontalmente; telas estreitas preservam primeiro a leitura das
  cartas, depois a decoração.
- Telas de Plantão e inspetores mudam para uma coluna e podem rolar sem esconder a ação principal.
- Alvos e cartas clicáveis precisam de estado de foco, nome acessível e operação por teclado.
- Cor nunca é o único indicador de A/B, aliado/inimigo, armado/utilizado ou vitória/derrota.
- Tooltips complementam rótulos; não podem ser a única forma de descobrir uma ação essencial.
- Áreas clicáveis não devem ser menores que o próprio elemento visual.

## Bans do projeto

Cosmos, neon, starfield, glassmorphism, gradiente em texto, Orbitron e fontes futuristas, mesa de
madeira de TCG, HUD de filme, sombras difusas de SaaS, emoji na UI e componentes genéricos sem
relação com o Instituto.
