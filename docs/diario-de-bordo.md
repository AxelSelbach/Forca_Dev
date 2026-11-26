# Diário de bordo — Forca Dev

## Aula 1 — Fundação do back-end

**O que fiz**
Na primeira aula foi realizado:
- Estrutura de pastas, iniciado repositório git e arquivos de documentação (vazios)
- Configurei o back-end: dependências (Fastify, Zod, Prisma 6.19.3, Vitest, tsx), scripts do `package.json`, `tsconfig.json` com `strict`, `.gitignore` e `.env`.
- Modelei o banco no `schema.prisma` (tabelas `palavras` e `partidas`), rodei `prisma migrate dev --name init` e conferi as tabelas no Prisma Studio.
- Escrevi o seed (24 palavras em 3 categorias, com `upsert`), os tipos compartilhados, o `ErroApp` e as regras do jogo como funções puras.

**O que consultei**
- Claude ajudou orientando a como fazer as migrations com o prisma e com a criação do seed

## Aula 2 — API completa e testes

**O que fiz**
- Configurado back-end e suas dependências (Zod, Prisma 6.19.3, Vitest, TSX e Fastify).
- Finalizado back-end e suas regras de negócios.
- Realizado testes

**Onde travei e como resolvi**
- No PowerShell, o `curl -X POST ... -H ... -d ...` deu erro, porque `curl` ali é apelido do `Invoke-WebRequest`. Resolvi usando `Invoke-RestMethod` (e `curl.exe` para ver o status HTTP dos erros).
- Os arquivos `package.json` e `package-lock.json` apareciam como não versionados. Aprendi a conferir com `git status --short` em que pasta eles estavam e versionei os do `backend/`, porque o lock trava as versões exatas (importante para o Prisma 6.19.3).


**O que consultei**
- IA (Claude): Explicações, ajuda para entender o erro do `curl` no PowerShell e o versionamento do `package.json`.

## Aula 3 — Front-end, documentação e conferência final

**O que fiz**
- Front-end criado usando Vite + React + TypeScript.
- Proxy `/api` configurado para `http://localhost:3333` 
- Copiei os tipos da API e escrevi o cliente tipado (`requisitar<T>`), com tratamento de erros e a mensagem "Servidor fora do ar".
- Criei os componentes `Mascara`, `Vidas`, `Teclado` e `Ranking` (props tipadas), as telas `Inicio`, `Jogo` e `Fim` e o `App`, que guarda o estado da partida e escolhe a tela pelo status.

**Onde travei e como resolvi**
- O VS Code mostrou o erro `Type 'StaticRangeInit' is not assignable to type 'ReactNode'` no `Ranking.tsx`. O componente estava certo: o problema estava no `types.ts`, onde o autocomplete do editor tinha trocado o tipo de `jogador` por `StaticRangeInit` em vez de `string`. Praticamente, um erro de digitação ao apertar enter para completar a palavra "string", mas acabou completando o `st` para `StaticRangeInit`.
 

**O que consultei**
- IA (Claude): Claude foi usado para auxiliar na criação do design da página, criação dos arquivos .md da pasta docs, principalmente para a estilização de markdown. Além de ajudar a resolver os erros de digitação.
