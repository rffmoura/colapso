# RULES.md — Regras canônicas de COLAPSO

Este documento descreve as regras implementadas no motor. Mudanças de mecânica devem atualizar
este arquivo, os textos das fichas e o Manual do Observador no mesmo conjunto de alterações.

## 1. Objetivo e estrutura

Você é o Observador humano do Instituto Meia-Vida. Em cada duelo, vence quem reduzir a
**Coerência** do oponente a zero.

Um **Plantão contínuo** possui quatro duelos:

1. Arquivo Norte.
2. Câmara de Ondas.
3. Subsolo Zero.
4. Autômato Supervisor.

Os três primeiros Autômatos começam com 25 de Coerência. O Supervisor começa com 30, antes de
qualquer bônus de Diretriz. Uma derrota encerra o Plantão e apaga estágio, arsenal e Diretrizes.
Não existe progressão permanente da sequência.

## 2. Preparação do duelo

- Cada lado usa uma cópia embaralhada do mesmo Arquivo de 20 fichas.
- O jogador recebe 4 fichas antes do primeiro turno; o Autômato recebe 5.
- O jogador age primeiro e compra até ficar com 5 fichas ao iniciar seu turno.
- Cada lado recebe 2 Qubits no primeiro turno. Com Núcleo Adiantado, o Autômato recebe 3.
- Cada lado começa com uma Contramedida ativa. A do jogador fica visível; a do Autômato fica sob
  sigilo até disparar.
- O Supervisor possui duas Contramedidas diferentes. A segunda fica em reserva e só é armada
  depois que a primeira dispara.
- O campo comporta até 6 Sujeitos por lado e a mão até 8 fichas.

## 3. Turno, energia e compra

No primeiro turno de cada lado, seu máximo é 2 Qubits. Nos turnos seguintes:

1. Seu máximo de **Qubits** aumenta em 1, até o limite de 8.
2. Seus Qubits são recarregados até o máximo atual.
3. O uso de Observar e os ataques dos seus Sujeitos são renovados.
4. Você compra até ficar com 5 fichas na mão, sempre comprando pelo menos 1.

Se a mão já estiver no limite de 8, uma ficha que seria comprada é marcada como extraviada e vai
para o descarte. Quando o Arquivo esvazia, o descarte é embaralhado e forma um novo Arquivo.

Durante seu turno, você pode jogar fichas, usar Observar e atacar em qualquer ordem enquanto
tiver alvos e Qubits válidos. Cada Sujeito pode atacar uma vez por turno.

## 4. Sujeitos, superposição e colapso

Um Sujeito entra em campo em **superposição**: os estados A e B existem ao mesmo tempo. Enquanto
estiver assim, ele ainda não possui Ataque, Vida nem palavras-chave ativas.

Um Sujeito em superposição colapsa quando:

- ataca ou é atacado;
- recebe dano de um Protocolo;
- é afetado por Medição, Polarização, Decoerência ou pelo efeito de entrada do Auditor;
- seu parceiro de Emaranhamento colapsa.

O colapso comum escolhe A ou B com 50% de chance para cada estado. O estado obtido permanece
ativo e não pode ser escolhido novamente por Observar ou Protocolos. A única troca posterior é
causada por Oscilação.

### Observar

**Observar** custa 2 Qubits e pode ser usado uma vez por turno em qualquer Sujeito em
superposição, aliado ou inimigo. O observador escolhe A ou B:

- 75% de chance de obter o estado escolhido;
- 25% de chance de obter o estado oposto.

Com Calibração Hostil, apenas o Autômato passa a influenciar em 85/15. O resultado registra o
observador, o alvo primário, a face desejada, a face obtida e se a influência teve sucesso.

Medição e Polarização produzem um colapso garantido, mas **não contam como Observar** e não
disparam Observador Observado. Um colapso secundário causado por Emaranhamento também não é uma
nova influência.

## 5. Combate e palavras-chave

Um Sujeito normalmente só pode atacar a partir do turno seguinte ao que entrou. Ao declarar um
ataque, o atacante colapsa primeiro, se necessário; um defensor em superposição colapsa em
seguida. Depois:

- contra outro Sujeito, atacante e defensor causam seus valores de Ataque um ao outro;
- contra o Observador inimigo, apenas a Coerência recebe dano;
- ao chegar a 0 de Vida, um Sujeito morre e sua ficha vai para o descarte;
- o dano restante permanece entre turnos.

### Palavras-chave

| Palavra-chave | Regra |
|---|---|
| **Barreira** | Enquanto houver um inimigo atacável com Barreira, ataques sem Fantasma devem mirar uma Barreira. |
| **Oscilação** | Depois de atacar e sobreviver, o Sujeito muda para o outro estado. A Vida atual não aumenta e fica limitada ao máximo do novo estado. |
| **Fantasma** | Ignora Barreira ao atacar. Quando ativado, também concede Intangível até o início do próximo turno do dono. |
| **Intangível** | O Sujeito não pode ser alvo de ataques inimigos. Protocolos ainda causam dano, assim como o revide de um combate que ele próprio iniciou. |

Palavras-chave impressas só funcionam depois que o estado correspondente colapsa. Fantasma
continua permitindo ignorar Barreira após o período de Intangível terminar. Oscilação não é um
novo colapso e, portanto, não se propaga por Emaranhamento.

## 6. Protocolos

Protocolos são resolvidos uma vez e depois permanecem no descarte.

| Protocolo | Custo | Alvo e efeito |
|---|---:|---|
| **Medição** | 3 | Escolha A ou B de qualquer Sujeito em superposição, aliado ou inimigo. O estado é garantido. |
| **Polarização** | 2 | Escolha A ou B de um Sujeito seu em superposição. O estado é garantido. |
| **Emaranhamento** | 2 | Vincule um Sujeito seu a um inimigo que ainda não estejam vinculados. Quando um colapsa, o parceiro em superposição colapsa no mesmo estado; quando um morre, o outro sofre 2 de dano. |
| **Túnel Quântico** | 2 | Um Sujeito seu ganha Fantasma até o início do próximo turno dele e fica Intangível nesse período. Se acabou de entrar, pode atacar no turno atual; um Sujeito que já atacou não recebe um ataque adicional. |
| **Pulso de Decaimento** | 3 | Cause 3 de dano a qualquer Sujeito ou ao Observador inimigo. Um Sujeito em superposição colapsa antes do dano. |
| **Decoerência** | 5 | Colapse aleatoriamente todos os Sujeitos inimigos em superposição e cause 2 de dano a cada inimigo em campo. |
| **Requisição** | 1 | Compre 2 fichas. O limite de 8 fichas na mão continua valendo. |

### Emaranhamento

- O vínculo pode existir entre Sujeitos colapsados ou em superposição.
- O colapso só é propagado se o parceiro ainda estiver em superposição.
- A face é copiada pelo índice: A acompanha A e B acompanha B.
- Quando um parceiro morre, o sobrevivente perde o vínculo e sofre 2 de dano de eco.
- O dano de eco pode causar outra morte e pode ser prevenido por Efeito Zeno.

## 7. Contramedidas

Uma Contramedida é equipada gratuitamente antes do duelo, fica ativa até seu gatilho e dispara no
máximo uma vez. A identidade da carta inimiga fica oculta, mas sua existência é pública. Depois de
usada, a carta permanece consultável no painel.

| Contramedida | Gatilho | Efeito |
|---|---|---|
| **Observador Observado** | Influência inimiga bem-sucedida contra seu Sujeito | O observador inimigo perde 5 de Coerência. Uma falha de 25% ou 15% não consome a carta. |
| **Efeito Zeno** | Primeiro Sujeito aliado que morreria | Ele permanece em campo com 1 de Vida. |
| **Retaliação Q-88** | Ataque direto de um Sujeito inimigo | Depois do dano direto, o atacante recebe 4 de dano. |
| **Reação em Cadeia** | Segunda ficha jogada pelo adversário no turno | Antes do efeito ou entrada da ficha, o adversário perde 4 de Coerência. Se morrer, a ficha não resolve. |
| **Protocolo de Emergência** | Primeiro dano letal contra seu Observador | Em vez de morrer, seu Observador fica com 3 de Coerência. |
| **Cópia Carbono** | Protocolo inimigo completamente resolvido | Compre 2 fichas. |
| **Resíduo de Energia** | Adversário encerra o turno com 3 ou mais Qubits | Ele perde 4 de Coerência antes da troca de turno. |

Efeitos produzidos por Contramedidas não ativam outras Contramedidas. Em particular, dano de
Contramedida não dispara Efeito Zeno nem Protocolo de Emergência. No Supervisor, a segunda
Contramedida é armada imediatamente após o consumo da primeira, mas não reage ao mesmo evento.

## 8. Diretrizes do Autômato

Diretrizes são cumulativas, sorteadas sem repetição e permanecem até o fim do Plantão.

| Diretriz | Efeito |
|---|---|
| **Blindagem Reforçada** | +4 de Coerência inicial para o Autômato em cada duelo restante. |
| **Núcleo Adiantado** | O Autômato começa o primeiro turno com 3 Qubits em vez de 2. |
| **Arquivo Prioritário** | O Autômato recebe +1 ficha antes de seu primeiro turno. |
| **Calibração Hostil** | Observar do Autômato passa de 75/25 para 85/15. |
| **Linha de Montagem** | O primeiro Sujeito jogado pelo Autômato a cada turno custa 1 Qubit a menos, mínimo zero. |

## 9. Progressão do Plantão

No início do Plantão, três Contramedidas aleatórias são oferecidas e uma delas é adquirida e
equipada. Após cada uma das três primeiras vitórias:

1. uma nova Diretriz não repetida é revelada e adicionada à dificuldade;
2. três Contramedidas ainda não adquiridas são oferecidas;
3. a escolhida entra no arsenal;
4. uma carta do arsenal é equipada para o próximo duelo.

Somente uma Contramedida do jogador pode ficar ativa em cada duelo. O Supervisor recebe duas
Contramedidas inimigas diferentes, usadas em sequência.

O estado do Plantão não usa `localStorage`. Apenas a preferência didática dos Memorandos do
Supervisor é persistida no navegador.

## 10. Ordem de resolução

Quando vários efeitos parecem acontecer juntos, use esta ordem:

### Jogar uma ficha

1. Verifique custo, espaço e alvos.
2. Pague os Qubits e retire a ficha da mão.
3. Registre a ficha jogada; Reação em Cadeia pode disparar aqui.
4. Se o jogador ainda estiver vivo, resolva a entrada do Sujeito ou o efeito do Protocolo.
5. Depois que um Protocolo termina, Cópia Carbono pode disparar.

### Atacar

1. Verifique Barreira, Intangível e os demais alvos legais.
2. Colapse o atacante, se necessário.
3. Colapse o defensor, se necessário.
4. Resolva o dano de combate ou o dano direto.
5. Aplique prevenções de morte antes de registrar morte ou fim de jogo.
6. Após um ataque direto sobrevivido, Retaliação Q-88 pode atingir o atacante.
7. Se o atacante ainda estiver vivo e seu estado tiver Oscilação, troque-o para o outro estado
   sem recuperar Vida.

### Observar

1. Pague 2 Qubits e marque o uso do turno.
2. Sorteie o resultado de 75/25 ou 85/15.
3. Colapse o alvo primário.
4. Propague o mesmo estado a um parceiro emaranhado ainda em superposição.
5. Se a influência primária foi bem-sucedida contra um inimigo, verifique Observador Observado.

### Morte e fim do turno

- Uma prevenção aplicável ocorre antes de morte e `gameover`.
- Ao morrer, o Sujeito vai ao descarte; depois, seu parceiro emaranhado sofre o eco.
- Ao encerrar o turno, efeitos temporários vencidos são removidos e Resíduo de Energia é
  verificado antes de passar a vez.
- Intangível termina no início do próximo turno do dono do Sujeito.

## 11. Informação da IA

O Autômato pode saber que existe uma Contramedida inimiga ativa, mas não pode consultar sua
identidade. Suas decisões devem ser iguais para estados públicos iguais. Ao usar Medição, ele
prefere a pior face tática de uma ameaça inimiga ou a melhor face de um aliado.
