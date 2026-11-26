# Forca Dev

Jogo da forca com termos de programação. O jogador informa um apelido, o servidor sorteia uma palavra secreta guardada no SQLite e o jogador chuta letras. Com 6 erros, perde; revelando a palavra, vence, ganha pontos e entra no ranking.

A palavra secreta **fica só no servidor**: o front-end recebe apenas a máscara (ex.: `PR_M_SE`) e só vê a palavra quando a partida termina.

## Tecnologias

- **Back-end:** Node.js, TypeScript, Fastify, Zod, Prisma ORM 6.19.3 e SQLite
- **Testes:** Vitest (com `app.inject` do Fastify)
- **Front-end:** Vite, React e TypeScript

## Pré-requisitos

- [Node.js](https://nodejs.org) 20 ou superior (inclui o npm)
- [Git](https://git-scm.com)

## Estrutura do projeto

```
forca-dev/
├── backend/
│   ├── prisma/          schema.prisma e migrations/
│   ├── src/
│   │   ├── database/    prisma.ts (PrismaClient único) e seed.ts
│   │   ├── game/        regras.ts (funções puras)
│   │   ├── repositories/
│   │   ├── services/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── schemas/     schemas Zod
│   │   └── errors.ts, app.ts, server.ts, types.ts
│   └── tests/           regras.test.ts e api.test.ts
├── frontend/            Vite + React + TypeScript
├── docs/                planejamento, api, decisões e diário de bordo
└── README.md
```

## Como rodar o back-end

Abra um terminal na pasta `backend/` e siga os passos.

**1. Instalar as dependências**

```bash
npm install
```

**2. Criar o arquivo `.env`** a partir do modelo:

```bash
# PowerShell (Windows)
Copy-Item .env.example .env

# Git Bash, Linux ou macOS
cp .env.example .env
```

O conteúdo é `DATABASE_URL="file:./forca.db"`: o banco fica em `backend/prisma/forca.db`.

**3. Criar o banco e aplicar as migrations**

```bash
npx prisma migrate dev
```

**4. Popular o banco com as palavras**

```bash
npm run seed
```

Deve aparecer `Seed concluído: 24 palavras`. O seed pode ser repetido sem duplicar nada.

**5. Subir a API**

```bash
npm run dev
```

A API fica em `http://localhost:3333`.

## Como rodar o front-end

Em **outro terminal**, na pasta `frontend/` (com a API do back-end rodando):

```bash
npm install
npm run dev
```

Abra `http://localhost:5173`. O Vite repassa as chamadas `/api/...` para a API na porta 3333 (proxy configurado em `vite.config.ts`), então não há problema de CORS.

## Como rodar os testes

Na pasta `backend/`:

```bash
npm test
```

Os testes de API usam um banco separado (`prisma/test.db`), criado automaticamente na primeira execução. O seu `forca.db` não é tocado.

## Regras do jogo (resumo)

- A partida começa com 6 vidas; cada letra errada consome 1 vida.
- Palpite é exatamente uma letra de A a Z (o servidor converte para maiúscula).
- Letra repetida responde 409 e não consome vida; partida encerrada não aceita palpites (409).
- Vitória: todas as letras reveladas. Derrota: vidas chegam a 0.
- Pontos na vitória = vidas restantes × 10 + letras distintas da palavra × 5. Derrota vale 0.
- Ranking = 10 vitórias com mais pontos; no empate, quem terminou primeiro fica à frente.

## Documentação

- [Planejamento](docs/planejamento.md): tabelas, rotas, tipos e ordem de trabalho
- [API](docs/api.md): todas as rotas, com exemplos e erros
- [Decisões técnicas](docs/decisoes.md)
- [Diário de bordo](docs/diario-de-bordo.md)

## Print da tela
![Tela do jogo](docs/tela.png)
