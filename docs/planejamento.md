# Planejamento — Forca Dev

> Este documento descreve o que foi planejado e implementado no projeto. Foi redigido durante a revisão do projeto, a partir do código final.

## 1. Visão geral

Jogo da forca com termos de programação. O servidor sorteia a palavra, aplica as regras e guarda tudo no SQLite. O front-end só exibe o estado devolvido pela API. A palavra secreta nunca é enviada enquanto a partida está em andamento.

## 2. Tabelas e colunas

### `palavras`

| Coluna | Tipo (Prisma / SQLite) | Detalhes |
|---|---|---|
| `id` | `Int` / INTEGER | Chave primária, autoincremento |
| `texto` | `String` / TEXT | Única. Maiúsculas, sem acento, espaço ou hífen |
| `categoria` | `String` / TEXT | Ex.: JavaScript, TypeScript, React |

### `partidas`

| Coluna | Tipo (Prisma / SQLite) | Detalhes |
|---|---|---|
| `id` | `Int` / INTEGER | Chave primária, autoincremento |
| `jogador` | `String` / TEXT | Apelido (3 a 20 caracteres) |
| `palavra_id` | `Int` / INTEGER | Chave estrangeira para `palavras.id` |
| `letras_tentadas` | `String` / TEXT | Padrão `""`. Letras concatenadas, ex.: `"EPRSMA"` |
| `erros` | `Int` / INTEGER | Padrão 0. As vidas restantes são `6 - erros` |
| `status` | `String` / TEXT | Padrão `em_andamento`. Valores: `em_andamento`, `vitoria`, `derrota` |
| `pontos` | `Int` / INTEGER | Padrão 0. Calculado só na vitória |
| `criada_em` | `DateTime` / DATETIME | Padrão: momento da criação |
| `finalizada_em` | `DateTime?` / DATETIME | Nulo até a partida terminar. Também desempata o ranking |

**Relacionamento:** uma palavra tem muitas partidas (`palavras 1 — N partidas`).

## 3. Rotas

| Método e rota | Corpo | Sucesso | Erros |
|---|---|---|---|
| `POST /api/partidas` | `{ "jogador": "ana" }` | 201 + `EstadoPartida` | 400 |
| `GET /api/partidas/:id` | — | 200 + `EstadoPartida` | 400, 404 |
| `POST /api/partidas/:id/palpites` | `{ "letra": "a" }` | 200 + `EstadoPartida` | 400, 404, 409 |
| `GET /api/ranking` | — | 200 + `ItemRanking[]` | — |

Detalhes completos em [api.md](api.md).

## 4. Tipos TypeScript principais

```ts
export type StatusPartida = 'em_andamento' | 'vitoria' | 'derrota';

export interface EstadoPartida {
  id: number;
  jogador: string;
  categoria: string;
  mascara: string;           // ex.: "PR_M_SE"
  letrasTentadas: string[];  // ex.: ["E", "P", "R"]
  vidasRestantes: number;    // 0 a 6
  status: StatusPartida;
  pontos: number;            // 0 enquanto não houver vitória
  palavra: string | null;    // null enquanto status === 'em_andamento'
}

export interface ItemRanking {
  jogador: string;
  pontos: number;
  palavra: string;
  finalizadaEm: string;      // data ISO
}

// src/game/regras.ts: entrada das regras puras (sem banco, sem HTTP)
export interface PartidaJogo {
  palavra: string;
  letrasTentadas: string[];
  erros: number;
  status: StatusPartida;
  pontos: number;
}
```

## 5. Onde cada regra de negócio é aplicada

| Regra | Onde |
|---|---|
| RN01 (6 vidas, erro consome 1) | `aplicarPalpite` em `src/game/regras.ts` |
| RN02 (uma letra A–Z, maiúscula) | Zod (`palpiteSchema`) na borda e `aplicarPalpite` como rede de segurança |
| RN03 (letra repetida = 409) | `aplicarPalpite` |
| RN04 (partida encerrada = 409) | `aplicarPalpite` |
| RN05 (vitória e derrota) | `aplicarPalpite` |
| RN06 (pontuação) | `calcularPontos` |
| RN07 (palavra oculta) | `paraEstado` em `partidas.service.ts` |
| RN08 (ranking) | `listarRanking` em `partidas.repository.ts` |

## 6. Ordem de trabalho

1. Estrutura de pastas, repositório Git, `.gitignore` e `.env.example`.
2. Setup do back-end: dependências, scripts e `tsconfig.json` com `strict`.
3. Prisma: `schema.prisma`, migration `init` e instância única do `PrismaClient`.
4. Seed com 24 palavras em 3 categorias (`upsert` dentro de `$transaction`).
5. Tipos compartilhados (`types.ts`) e `ErroApp`.
6. Regras do jogo como funções puras e seus testes (Vitest).
7. Repositories, depois o service (que une banco e regras).
8. Camada HTTP: schemas Zod, controllers, rotas, `app.ts` com `setErrorHandler` central e `server.ts`.
9. Teste manual das rotas e testes automatizados da API com banco de testes separado.
10. Front-end: Vite + React + TS, proxy, cliente da API, componentes, telas e estilo.
11. Documentação final e conferência do checklist de entrega.
