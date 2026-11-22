import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { criarApp } from '../src/app';
import { prisma } from '../src/database/prisma';
import type { EstadoPartida, ItemRanking } from '../src/types';

const app = criarApp();

beforeAll(async()=>{
  await app.ready()
  await prisma.partida.deleteMany()
  await prisma.palavra.deleteMany()
  await prisma.palavra.create({
    data: {texto: 'PROMISE', categoria: 'JavaScript'}
  })
})

beforeEach(async()=>{
  await prisma.partida.deleteMany()
})

afterAll(async()=>{
  await app.close()
  await prisma.$disconnect()
})

async function criarPartida(jogador = 'ana'): Promise<EstadoPartida> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/partidas',
    payload: {jogador}
  })
  return res.json<EstadoPartida>()
}

function palpitar(id: number, letra: string){
  return app.inject({
    method: 'POST',
    url: `/api/partidas/${id}/palpites`,
    payload: {letra}
  })
}

async function jogar(id: number, letras: string[]): Promise<EstadoPartida>{
  let estado!: EstadoPartida
  for(const letra of letras){
    estado = (await palpitar(id, letra)).json<EstadoPartida>()
  }
  return estado
}

describe('POST /api/partidas', ()=>{
  it('cria a partida com 201, máscara oculta e palavra null', async()=>{
    const res = await app.inject({
      method: 'POST',
      url: '/api/partidas',
      payload: {jogador: 'ana'}
    })
    const corpo = res.json<EstadoPartida>()

    expect(res.statusCode).toBe(201)
    expect(corpo.mascara).toBe('_______')
    expect(corpo.vidasRestantes).toBe(6)
    expect(corpo.status).toBe('em_andamento')
    expect(corpo.palavra).toBeNull()
  })

  it('recusa apelido curto com 400 e formato {erro}', async()=>{
    const res = await app.inject({
      method: 'POST',
      url: '/api/partidas',
      payload: {jogador: 'a'}
    })

    expect(res.statusCode).toBe(400)
    expect(res.json()).toHaveProperty('erro')
  })
})

describe('GET /api/partidas/:id', ()=>{
  it('devolve 404 para partida inexistente', async()=>{
    const res = await app.inject({method: 'GET', url: '/api/partidas/9999'})

    expect(res.statusCode).toBe(404)
    expect(res.json()).toHaveProperty('erro')
  })

  it('devolve 400 para id inválido', async()=>{
    const res = await app.inject({method: 'GET', url: '/api/partidas/abc'})

    expect(res.statusCode).toBe(400)
  })
})

describe('POST /api/partidas/:id/palpites', ()=>{
  it('acerto revela a letra e não tira vida', async()=>{
    const {id} = await criarPartida()
    const res = await palpitar(id, 'p')
    const corpo = res.json<EstadoPartida>()

    expect(res.statusCode).toBe(200)
    expect(corpo.mascara).toBe('P______')
    expect(corpo.vidasRestantes).toBe(6)
  })

  it('erro tira 1 vida', async()=>{
    const {id} = await criarPartida()
    const corpo = (await palpitar(id, 'z')).json<EstadoPartida>()

    expect(corpo.vidasRestantes).toBe(5)
    expect(corpo.letrasTentadas).toEqual(['Z'])
  })

  it('letra repetida responde 409 e não tira vida (RN03)', async()=>{
    const {id} = await criarPartida()
    await palpitar(id, 'z')
    const repetido = await palpitar(id, 'z')
    const estado = await app.inject({method: 'GET', url: `/api/partidas/${id}`})

    expect(repetido.statusCode).toBe(409)
    expect(estado.json<EstadoPartida>().vidasRestantes).toBe(5)
  })

  it('letra inválida responde 400 (RN02)', async()=>{
    const {id} = await criarPartida()

    expect((await palpitar(id, 'ab')).statusCode).toBe(400)
    expect((await palpitar(id, '1')).statusCode).toBe(400)
  })

  it('partida inexistente responde 404', async()=>{
    expect((await palpitar(9999, 'a')).statusCode).toBe(404)
  })

  it('nunca envia a palavra enquanto em andamento (RN07)', async()=>{
    const {id} = await criarPartida()
    const res = await palpitar(id, 'p')

    expect(res.json<EstadoPartida>().palavra).toBeNull()
    expect(res.body).not.toContain('PROMISE')
  })

  it('vitória revela a palavra e dá 95 pontos sem erros', async()=>{
    const {id} = await criarPartida()
    const final = await jogar(id, ['P', 'R', 'O', 'M', 'I', 'S', 'E'])

    expect(final.status).toBe('vitoria')
    expect(final.palavra).toBe('PROMISE')
    expect(final.pontos).toBe(95)
  })

  it('derrota revela a palavra, zera pontos e bloqueia novos palpites (RN04)', async()=>{
    const {id} = await criarPartida()
    const final = await jogar(id, ['A', 'B', 'C', 'D', 'F', 'G'])

    expect(final.status).toBe('derrota')
    expect(final.vidasRestantes).toBe(0)
    expect(final.pontos).toBe(0)
    expect(final.palavra).toBe('PROMISE')
    expect((await palpitar(id, 'P')).statusCode).toBe(409)
  })
})

describe('GET /api/ranking', ()=>{
  it('lista só vitórias, com o maior pontuador primeiro (RN08)', async()=>{
    const vencedora = await criarPartida('maria')
    await jogar(vencedora.id, ['P', 'R', 'O', 'M', 'I', 'S', 'E'])

    const outra = await criarPartida('joao')
    await jogar(outra.id, ['Z', 'P', 'R', 'O', 'M', 'I', 'S', 'E'])

    const perdedora = await criarPartida('pedro')
    await jogar(perdedora.id, ['A', 'B', 'C', 'D', 'F', 'G'])

    const res = await app.inject({method: 'GET', url: '/api/ranking'})
    const ranking = res.json<ItemRanking[]>()

    expect(res.statusCode).toBe(200)
    expect(ranking.map((r)=>r.jogador)).toEqual(['maria', 'joao'])
    expect(ranking[0].pontos).toBe(95)
    expect(ranking[0].palavra).toBe('PROMISE')
  })
})

describe('rotas inexistentes', ()=>{
  it('respondem 404 no formato {erro}', async()=>{
    const res = await app.inject({method: 'GET', url: '/api/nao-existe'})

    expect(res.statusCode).toBe(404)
    expect(res.json()).toHaveProperty('erro')
  })
})