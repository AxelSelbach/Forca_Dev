# Documentação da API — Forca Dev

Base: `http://localhost:3333`. Todas as rotas ficam sob o prefixo `/api`. Corpo e respostas são JSON.

## Formato de erro

Todo erro responde no formato:

```json
{ "erro": "mensagem" }
```

Quando a validação do Zod falha (status 400), a resposta traz também o campo `detalhes` com a lista de problemas encontrados:

```json
{
  "erro": "Dados inválidos",
  "detalhes": [ { "path": ["jogador"], "message": "..." } ]
}
```

Erros gerais, válidos para qualquer rota:

| Status | Quando acontece | Resposta |
|---|---|---|
| 404 | A rota não existe | `{ "erro": "Rota não encontrada" }` |
| 500 | Erro inesperado no servidor | `{ "erro": "Erro interno" }` |

## Tipos devolvidos

```ts
type StatusPartida = 'em_andamento' | 'vitoria' | 'derrota';

interface EstadoPartida {
  id: number;
  jogador: string;
  categoria: string;
  mascara: string;           // ex.: "PR_M_SE"
  letrasTentadas: string[];
  vidasRestantes: number;    // 0 a 6
  status: StatusPartida;
  pontos: number;            // 0 enquanto não houver vitória
  palavra: string | null;    // null enquanto status === 'em_andamento'
}

interface ItemRanking {
  jogador: string;
  pontos: number;
  palavra: string;
  finalizadaEm: string;      // data ISO
}
```

---

## `POST /api/partidas`

Cria uma partida: sorteia uma palavra do banco e devolve a máscara, a categoria e as vidas.

**Corpo de entrada**

```json
{ "jogador": "ana" }
```

O apelido tem de 3 a 20 caracteres (espaços nas pontas são removidos antes de validar).

**Sucesso: `201 Created`**

```json
{
  "id": 1,
  "jogador": "ana",
  "categoria": "TypeScript",
  "mascara": "_______",
  "letrasTentadas": [],
  "vidasRestantes": 6,
  "status": "em_andamento",
  "pontos": 0,
  "palavra": null
}
```

**Erros**

| Status | Quando acontece |
|---|---|
| 400 | `jogador` ausente, não é texto, tem menos de 3 ou mais de 20 caracteres |
| 400 | JSON malformado ou corpo vazio com `Content-Type: application/json` (mensagem do Fastify) |
| 500 | Não há nenhuma palavra no banco (`{ "erro": "Nenhuma palavra cadastrada. Rode o seed." }`) |

---

## `GET /api/partidas/:id`

Devolve o estado atual de uma partida.

**Sucesso: `200 OK`**

```json
{
  "id": 1,
  "jogador": "ana",
  "categoria": "TypeScript",
  "mascara": "___A___",
  "letrasTentadas": ["A"],
  "vidasRestantes": 6,
  "status": "em_andamento",
  "pontos": 0,
  "palavra": null
}
```

**Erros**

| Status | Quando acontece |
|---|---|
| 400 | `:id` não é um número inteiro positivo (ex.: `abc`, `-1`, `1.5`) |
| 404 | Não existe partida com esse id (`{ "erro": "Partida não encontrada" }`) |

---

## `POST /api/partidas/:id/palpites`

Aplica um palpite de letra e devolve o novo estado. Todas as regras são verificadas no servidor.

**Corpo de entrada**

```json
{ "letra": "p" }
```

A letra pode vir em minúscula ou maiúscula; o servidor converte para maiúscula.

**Sucesso: `200 OK`** (partida em andamento; a palavra continua oculta)

```json
{
  "id": 1,
  "jogador": "ana",
  "categoria": "JavaScript",
  "mascara": "P______",
  "letrasTentadas": ["P"],
  "vidasRestantes": 6,
  "status": "em_andamento",
  "pontos": 0,
  "palavra": null
}
```

**Sucesso: `200 OK`** (último palpite de uma vitória: a palavra é revelada e os pontos são calculados)

```json
{
  "id": 1,
  "jogador": "ana",
  "categoria": "JavaScript",
  "mascara": "PROMISE",
  "letrasTentadas": ["P", "R", "O", "M", "I", "S", "E"],
  "vidasRestantes": 6,
  "status": "vitoria",
  "pontos": 95,
  "palavra": "PROMISE"
}
```

Pontos na vitória = vidas restantes × 10 + letras distintas da palavra × 5. Nesse exemplo: 6 × 10 + 7 × 5 = 95. Na derrota, `status` é `derrota`, `pontos` é 0 e a palavra também é revelada.

**Erros**

| Status | Quando acontece |
|---|---|
| 400 | `letra` ausente ou inválida: qualquer valor que não seja exatamente uma letra de A a Z (`"ab"`, `"1"`, `""`, `"ç"`) |
| 400 | `:id` não é um número inteiro positivo |
| 404 | Não existe partida com esse id |
| 409 | Letra já tentada (`{ "erro": "Letra já tentada" }`); a vida **não** é consumida |
| 409 | Partida já encerrada, por vitória ou derrota (`{ "erro": "Partida já encerrada" }`) |

A validação (400) acontece primeiro, depois a busca da partida (404) e, por fim, as regras do jogo (409).

---

## `GET /api/ranking`

Lista as 10 vitórias com mais pontos. Em caso de empate, quem terminou primeiro fica à frente. Partidas perdidas ou em andamento não aparecem.

**Sucesso: `200 OK`**

```json
[
  {
    "jogador": "maria",
    "pontos": 95,
    "palavra": "PROMISE",
    "finalizadaEm": "2026-11-22T14:03:11.000Z"
  },
  {
    "jogador": "joao",
    "pontos": 85,
    "palavra": "PROMISE",
    "finalizadaEm": "2026-11-22T14:05:42.000Z"
  }
]
```

Se ainda não houver nenhuma vitória, a resposta é uma lista vazia: `[]`.

**Erros:** nenhum específico desta rota (apenas os erros gerais).

---

## Como o front-end consome a API

| Tela | Rota usada | Quando |
|---|---|---|
| Início | `GET /api/ranking` | Ao abrir a tela, para preencher a tabela do top 10 |
| Início | `POST /api/partidas` | Ao clicar em **Jogar** |
| Jogo | `POST /api/partidas/:id/palpites` | A cada letra escolhida no teclado |
| Fim | nenhuma | A tela usa o último estado devolvido pelo servidor |

O front não usa `GET /api/partidas/:id`: o estado da partida vem sempre da resposta do último `POST`.

**Erros na tela:** quando a API responde com `{ "erro": "..." }`, o front mostra o texto do campo `erro`. Quando não há resposta utilizável (API desligada, falha de rede ou resposta 5xx sem JSON), mostra "Servidor fora do ar. Tente novamente em instantes."

**Em desenvolvimento**, o front chama caminhos relativos (`/api/...`) na porta 5173, e o proxy do Vite repassa para a API em `http://localhost:3333`.
