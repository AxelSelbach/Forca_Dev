# Decisões técnicas — Forca Dev

## Decisão 1 — A palavra secreta fica só no servidor

- **Contexto:** o front-end precisa mostrar o progresso da partida, mas não pode permitir trapaça. Qualquer dado enviado ao navegador aparece na aba Network do DevTools.
- **Decisão:** a API devolve apenas a máscara (ex.: `P_____E`). O campo `palavra` vem `null` enquanto o status é `em_andamento` e só é preenchido na vitória ou na derrota. A conversão é feita em um único ponto, a função `paraEstado` do service.
- **Alternativa descartada:** enviar a palavra completa e escondê-la no front-end.
- **Consequência:** cada palpite exige uma requisição ao servidor. Em troca, o ranking é confiável. Há um teste automatizado que garante que o texto da palavra não aparece em nenhum lugar do corpo da resposta durante a partida.

## Decisão 2 — Regras do jogo como funções puras, desacopladas do banco

- **Contexto:** as regras (RN01 a RN06) são o coração do jogo e precisam ser testadas com facilidade, sem depender de banco de dados nem de HTTP.
- **Decisão:** as regras ficam em `src/game/regras.ts` como funções puras que recebem e devolvem um tipo próprio (`PartidaJogo`), em vez do tipo gerado pelo Prisma. `aplicarPalpite` devolve uma partida nova, sem alterar a recebida. Ela também não grava a data de fim: `new Date()` torna a função impura, então quem define `finalizadaEm` é o service.
- **Alternativa descartada:** colocar as regras dentro do service, usando diretamente o objeto do Prisma e a data atual.
- **Consequência:** os testes das regras são rápidos e não precisam de banco. Em contrapartida, o service precisa converter entre o formato do banco e o `PartidaJogo` a cada palpite.

## Decisão 3 — Guardar `erros` e as letras como texto simples

- **Contexto:** o SQLite não tem tipo array, e a API precisa devolver `vidasRestantes` e `letrasTentadas` (lista).
- **Decisão:** a tabela `partidas` guarda `erros` (inteiro) e `letras_tentadas` como texto concatenado (ex.: `"EPRSMA"`). As vidas restantes são derivadas: `6 - erros`. O service converte com `split('')` e `join('')`.
- **Alternativa descartada:** guardar `vidas_restantes` como coluna própria, ou criar uma tabela `palpites` com uma linha por letra.
- **Consequência:** o modelo fica pequeno e não há dado duplicado que possa ficar inconsistente (vidas e erros nunca divergem). O preço é a conversão texto ↔ lista no service, e o modelo não guarda a ordem cronológica dos palpites além da própria ordem do texto.

## Decisão 4 — Validação com Zod na borda e tratamento central de erros

- **Contexto:** a API precisa recusar entradas inválidas e responder todo erro no mesmo formato `{ "erro": "mensagem" }`.
- **Decisão:** os schemas Zod validam corpo e parâmetros no início de cada controller. Qualquer erro (`ZodError`, `ErroApp` ou erro do Fastify) é lançado com `throw` e tratado em um único `setErrorHandler` em `app.ts`, que traduz cada tipo para o status e o formato corretos.
- **Alternativa descartada:** validar manualmente com `if` em cada rota e usar `try/catch` em cada handler.
- **Consequência:** os handlers ficam curtos e sem tratamento repetido, e é impossível esquecer o formato do erro em alguma rota. A letra também é conferida de novo dentro de `aplicarPalpite`, como rede de segurança, o que repete uma checagem de propósito.

## Decisão 5 — Testes de API com banco de testes separado

- **Contexto:** os testes da API precisam apagar e recriar dados para ficarem previsíveis, e isso não pode destruir o banco de desenvolvimento.
- **Decisão:** o Vitest troca a `DATABASE_URL` para `file:./test.db` durante os testes. Um `globalSetup` roda `prisma db push` para criar as tabelas nesse banco. O banco de testes recebe uma única palavra (`PROMISE`), o que torna o sorteio previsível. Os arquivos de teste rodam em sequência (`fileParallelism: false`).
- **Alternativa descartada:** usar o `forca.db` nos testes, ou simular (mock) o Prisma Client.
- **Consequência:** os testes exercitam o caminho real (rota, Zod, service, Prisma e SQLite) e o `forca.db` fica intacto. A primeira execução é um pouco mais lenta, por criar o `test.db`, que é ignorado pelo Git.

## Decisão 6 — O estado da partida vem sempre do servidor

- **Contexto:** o front-end precisa mostrar a partida, mas as regras (vidas, vitória, derrota, pontos) já são aplicadas no servidor. Duplicá-las no front criaria duas fontes da verdade.
- **Decisão:** o `App` guarda um único `EstadoPartida` devolvido pela API e escolhe a tela pelo `status` (`Inicio` sem partida, `Jogo` em andamento, `Fim` em vitória ou derrota). A cada palpite, o front envia a letra e substitui o estado inteiro pelo que o servidor devolve, sem alterar nada localmente. Não há roteador.
- **Alternativa descartada:** atualizar a tela localmente antes da resposta (otimista) replicando as regras no front, e usar React Router com uma URL por partida.
- **Consequência:** a tela é sempre coerente com o servidor. Em troca, cada palpite espera a resposta (o teclado fica desabilitado e aparece "Enviando palpite…"), e recarregar a página perde a partida em andamento, porque o id só fica em memória.

## Decisão 7 — Cliente da API único, tipado e com erros amigáveis

- **Contexto:** o front precisa mostrar mensagens claras quando a API recusa um pedido (400, 404, 409) e também quando ela está fora do ar (RF04), sem usar `any`.
- **Decisão:** todas as chamadas passam por uma função genérica, `requisitar<T>`, em `api/cliente.ts`. Ela converte falha de rede ou resposta 5xx sem corpo em "Servidor fora do ar" e, nos demais erros, repassa o campo `erro` da API. O corpo da resposta é tratado como `unknown` e só é lido depois de verificado.
- **Alternativa descartada:** chamar `fetch` diretamente dentro de cada componente, tratando erro e tipando a resposta em cada lugar (com risco de `any`).
- **Consequência:** as telas só usam `api.*` e `mensagemDeErro`, e o tratamento de erro fica em um só lugar. O limite é que o `as T` na saída confia no contrato da API, sem validar o formato em tempo de execução.

## Decisão 8 — O teclado deduz acerto e erro pela máscara

- **Contexto:** o teclado precisa mostrar letras certas e erradas em cores diferentes (RF03), mas o contrato da API não devolve listas separadas de acertos e erros.
- **Decisão:** uma letra tentada que aparece na máscara é um acerto; uma letra tentada que não aparece é um erro. A dedução funciona porque o servidor gera a máscara só com as letras tentadas, inclusive no fim da partida.
- **Alternativa descartada:** acrescentar campos de acertos e erros na resposta da API, ou calcular no front com a palavra (que o front não tem durante a partida).
- **Consequência:** o contrato da API continua o mesmo e o componente fica simples. Ele depende de a máscara nunca revelar letras não tentadas, o que já é garantido pelas regras do servidor.

## Decisão 9 — Proxy do Vite em vez de depender de CORS

- **Contexto:** em desenvolvimento, o front roda na porta 5173 e a API na 3333, e o navegador trata portas diferentes como origens diferentes.
- **Decisão:** o `vite.config.ts` repassa tudo que começa com `/api` para `http://localhost:3333`. O front usa só caminhos relativos (`/api/partidas`), sem URL absoluta no código. O back-end também registra `@fastify/cors`, como segunda camada.
- **Alternativa descartada:** colocar a URL completa da API no front e depender só do CORS.
- **Consequência:** o código do front não muda entre ambientes e não há erro de CORS no desenvolvimento. Em produção seria preciso um proxy equivalente no servidor. Como o `target` é uma única linha de configuração, um erro de digitação nela derruba todas as chamadas: aconteceu neste projeto (`http:/localhost` com uma barra só), e a causa foi achada comparando o log do Vite com a resposta direta do back-end.
