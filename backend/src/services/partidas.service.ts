import { ErroApp } from '../errors';
import {
  aplicarPalpite,
  gerarMascara,
  VIDAS_INICIAIS,
  type PartidaJogo,
} from '../game/regras'
import * as partidasRepo from '../repositories/partidas.repository'
import type { PartidaComPalavra } from '../repositories/partidas.repository'
import * as palavrasRepo from '../repositories/palavras.repository'
import type { EstadoPartida, ItemRanking, StatusPartida } from '../types'

function paraEstado(p: PartidaComPalavra): EstadoPartida{
  const status = p.status as StatusPartida
  const tentadas = p.letrasTentadas.split('')

  return {
    id: p.id,
    jogador: p.jogador,
    categoria: p.palavra.categoria,
    mascara: gerarMascara(p.palavra.texto, tentadas),
    letrasTentadas: tentadas,
    vidasRestantes: VIDAS_INICIAIS - p.erros,
    status,
    pontos: p.pontos,
    palavra: status === 'em_andamento' ? null : p.palavra.texto
  }
}

async function buscarOuFalhar(id: number): Promise<PartidaComPalavra>{
  const partida = await partidasRepo.buscarPorId(id)
  if (!partida) throw new ErroApp('Partida não encontrada', 404)
  return partida
}

export async function criarPartida(jogador: string): Promise<EstadoPartida>{
  const palavra = await palavrasRepo.sortearPalavra()
  if (!palavra) throw new ErroApp('Nenhuma palavra cadastrada. Rode o seed.', 500)

  const partida = await partidasRepo.criar(jogador, palavra.id)
  return paraEstado(partida)
}

export async function buscarPartida(id: number): Promise<EstadoPartida>{
  return paraEstado(await buscarOuFalhar(id))
}

export async function palpitar(id: number, letra: string): Promise<EstadoPartida>{
  const atual = await buscarOuFalhar(id)

  const jogo: PartidaJogo = {
    palavra: atual.palavra.texto,
    letrasTentadas: atual.letrasTentadas.split(''),
    erros: atual.erros,
    status: atual.status as StatusPartida,
    pontos: atual.pontos,
  }

  const novo = aplicarPalpite(jogo, letra)

  const atualizada = await partidasRepo.atualizar(id, {
    letrasTentadas: novo.letrasTentadas.join(''),
    erros: novo.erros,
    status: novo.status,
    pontos: novo.pontos,
    finalizadaEm: novo.status !== 'em_andamento' ? new Date() : undefined
  })

  return paraEstado(atualizada)
}

export async function listarRanking(): Promise<ItemRanking[]> {
  const top = await partidasRepo.listarRanking()
  return top.map((p) => ({
    jogador: p.jogador,
    pontos: p.pontos,
    palavra: p.palavra.texto,
    finalizadaEm: (p.finalizadaEm ?? p.criadaEm).toISOString()
  }))
}