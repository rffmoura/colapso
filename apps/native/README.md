# COLAPSO nativo

Aplicação Expo SDK 55 em React Native. A interface é própria para toque e usa as mesmas regras,
cartas, IA e sequência de Plantão da versão web.

## Preparação

- macOS com Xcode e simuladores iOS instalados;
- Node `20.19.4` ou mais recente (`nvm use` na raiz);
- CocoaPods disponível para o primeiro prebuild;
- development build — Expo Go não é usado.

```bash
# na raiz do workspace
nvm use
npm install
npm run ios:native
npm run ios:native:device # instalação direta em um aparelho conectado

# nos próximos ciclos, mantenha o build instalado e inicie o Metro
npm run dev:native          # simulador, localhost IPv4
npm run dev:native:device   # iPad ou iPhone físico na mesma rede
```

O script do simulador força `localhost` em IPv4 para evitar a resolução IPv6 do macOS. O
dispositivo físico usa o script LAN e precisa alcançar o Mac pela rede local.

## Verificações

```bash
npm run typecheck
npm test
npm run doctor:native
npm run export:native
```

## Estrutura

```text
src/app/                 entrada Expo Router e carregamento de fontes
src/native/ColapsoApp    ciclo de vida, hidratação e navegação por fase
src/native/RunScreens    título, draft, briefing, recompensa e relatório
src/native/GameBoard     bancada, mão retrátil, mira e Emaranhamento
src/native/components    fichas, painéis, inspetores e PresentationCue
src/native/audio         efeitos locais pré-carregados
src/native/settings      som e resposta tátil persistidos
```

O app é bloqueado em paisagem, usa safe areas e não possui hover, cursor virtual ou tooltips
automáticos. Durante a mira, tocar no painel do Autômato significa exclusivamente ataque direto.

## Checkpoint

AsyncStorage guarda um `RunCheckpoint` no começo de cada setor. Se o app sair durante o duelo,
ele retorna ao briefing e reinicia somente aquela partida. O checkpoint é apagado ao perder,
concluir ou iniciar um novo Plantão.
