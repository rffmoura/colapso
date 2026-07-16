# PRODUCT.md — COLAPSO · Instituto Meia-Vida

## O que é

**COLAPSO** é um card game single-player para web e dispositivos móveis em que um Observador
humano enfrenta o Autômato do Instituto Meia-Vida. Os Sujeitos entram em campo em superposição,
com dois estados possíveis, e só ativam Ataque, Vida e habilidades quando colapsam.

A experiência atual é um **Plantão contínuo** de quatro duelos: três setores e uma batalha final
contra o Autômato Supervisor. Entre confrontos, a máquina recebe Diretrizes cumulativas e o
jogador amplia seu arsenal de Contramedidas.

O jogo é 100% front-end, sem backend ou conta. Os dois lados usam cópias da mesma lista fixa de
deck, com IA local e sessões curtas. Clareza, personalidade e decisões táticas têm prioridade.

## Registro

register: brand

O jogo é o produto; regras, sensação visual, personagens, animações e didática são requisitos de
primeira classe.

## Lore canônica

O Instituto Meia-Vida estuda o que o universo faz quando ninguém está olhando. Toda noite, um
Observador humano e o Autômato disputam a custódia dos Sujeitos do Arquivo. Observar é interferir;
interferir é vencer.

O jogador é o Observador responsável pelo turno da noite. O Autômato representa a burocracia do
Instituto: registra, mede, arquiva e reage automaticamente a qualquer desvio de protocolo.

## Público e sessão

- Jogadores casuais de card games como Hearthstone, Marvel Snap e Balatro.
- Partidas desejadas de aproximadamente 6–9 minutos por duelo.
- Experiência web responsiva e aplicação React Native em paisagem, primeiro para iPad e iPhone.
- Regras compreensíveis sem exigir leitura prévia de documentação externa.

A primeira versão foi considerada confusa. O produto deve ensinar jogando: textos diretos,
tooltips, Memorandos do Supervisor na primeira ocorrência e um Manual do Observador curto e
consultável.

## Promessa central

Cada Sujeito é duas possibilidades táticas até alguém interferir. O jogador decide quando aceitar
o acaso, quando influenciá-lo e quando gastar mais recursos para garantir um estado.

Essa promessa se apoia em três níveis de controle:

1. **Colapso comum:** A ou B em 50/50, sem custo adicional.
2. **Observar:** escolha desejada em 75/25, por 2 Qubits, uma vez por turno.
3. **Protocolos:** Polarização garante um estado aliado por 2 Qubits; Medição garante o estado de
   qualquer Sujeito por 3.

## Loop do duelo

1. Receba Qubits e reabasteça a mão.
2. Jogue Sujeitos em superposição e Protocolos de efeito imediato.
3. Ataque, provoque colapsos e manipule A/B com Observar.
4. Antecipe a Contramedida inimiga oculta e planeje ao redor da sua.
5. Reduza a Coerência adversária a zero antes que a sua seja zerada.

O combate é persistente: Sujeitos sobreviventes mantêm o dano. O Arquivo reembaralha o descarte
quando esvazia, e o refil garante pelo menos uma compra por turno para evitar turnos mortos. A
curva de energia começa em 2 Qubits e cresce até 8, permitindo uma decisão útil desde a abertura.

## Plantão contínuo

O Plantão transforma duelos isolados em uma sequência curta de risco crescente:

- Antes do primeiro duelo, o jogador escolhe uma de três Contramedidas.
- Cada lado equipa uma Contramedida sem custo; a inimiga fica confidencial até disparar.
- Após cada uma das três primeiras vitórias, uma nova Diretriz fortalece o Autômato.
- Na mesma recompensa, o jogador escolhe uma Contramedida ainda não adquirida e depois equipa
  uma carta de seu arsenal para o próximo setor.
- Diretrizes não se repetem e permanecem cumulativas durante o Plantão.
- O Supervisor começa com 30 de Coerência e duas Contramedidas diferentes, armadas em sequência.
- Uma derrota encerra a tentativa e apaga toda a progressão da sequência.

Não existe metaprogressão. No nativo, um checkpoint técnico é salvo apenas no começo do setor:
fechar o app durante o duelo retorna ao briefing e reinicia aquele confronto com o mesmo arsenal,
Diretrizes e Contramedida. Preferências didáticas, som e resposta tátil ficam no dispositivo.

## Sistemas estratégicos

### Superposição e colapso

A dualidade A/B é a identidade do jogo. Antes do colapso, nenhuma palavra-chave impressa está
ativa. Atacar, ser atacado e certos Protocolos ativam um estado. Oscilação é a exceção tática:
depois de atacar e sobreviver, algumas faces mudam para o outro estado sem recuperar Vida.

### Contramedidas

São reações automáticas, gratuitas e de uso único. A carta própria fica visível para permitir
planejamento; a inimiga comunica apenas que existe uma ameaça. Depois do disparo, ela permanece
visível e consultável. Efeitos secretos não iniciam outras Contramedidas.

### Diretrizes

São modificadores cumulativos da IA: mais Coerência, mais energia, mais fichas, influência mais
precisa ou desconto de custo. Devem elevar a dificuldade sem alterar o deck ou criar regras
invisíveis durante o duelo; por isso são mostradas no briefing.

### Fantasma e Intangível

Fantasma ignora Barreira quando o Sujeito ataca. Ao ser ativado, também concede Intangível até o
próximo turno do dono: ataques inimigos não podem escolhê-lo, mas Protocolos e revides ainda o
atingem.

## Princípios de produto

1. **A dualidade deve ser visível:** A e B precisam ser compreendidos antes de qualquer texto
   avançado.
2. **Agência sobre acaso:** escolhas devem alterar probabilidades ou garantir resultados, não
   apenas repetir o mesmo sorteio.
3. **Informação parcial justa:** a IA pode reconhecer uma ameaça oculta, mas nunca conhecer a
   identidade da Contramedida do jogador.
4. **Personagens antes de símbolos:** cada Sujeito tem nome, retrato, bio e voz própria.
5. **Legibilidade vence espetáculo:** nomes, estados, Vida, dano, custos e gatilhos nunca podem ser
   encobertos.
6. **Nunca um turno morto:** refil, reembaralhamento e curva de Qubits mantêm opções disponíveis.
7. **Dificuldade explicável:** toda Diretriz é mostrada antes do duelo em que passa a valer.
8. **Sem reação infinita:** efeitos de Contramedida não ativam outras Contramedidas.

## Escopo atual

- Nove Sujeitos e sete Protocolos; Arquivo fixo de 20 fichas por lado.
- Sete Contramedidas e cinco Diretrizes.
- IA local com decisões baseadas somente em informações públicas e regras permitidas.
- Quatro duelos, recompensa entre setores, arsenal, chefe e reinício da sequência.
- Manual, consulta contextual, Memorandos, animações, áudio e resposta tátil no nativo.
- Uma única fonte de regras e IA compartilhada entre web e React Native.
- Sem coleção, deckbuilding, PvP, backend, conta ou progressão permanente.

## Metas de playtest

- Observar usado em 25–45% dos turnos elegíveis.
- Escolhas de A/B contextuais, sem uma face universalmente correta.
- Duelo médio de 6–9 minutos.
- Vitória do jogador próxima de 45–55% no primeiro setor.
- Contramedidas compreensíveis depois do primeiro disparo e relevantes para decisões futuras.

As regras numéricas e a ordem de resolução ficam em [RULES.md](RULES.md).
