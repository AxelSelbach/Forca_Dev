import { prisma } from '../database/prisma'
import { Prisma } from '@prisma/client'

export type PartidaComPalavra = Prisma.PartidaGetPayload<{
    include: {palavra: true}
}>

export interface DadosPalpite {
    letrasTentadas: string
    erros: number
    status: string
    pontos: number
    finalizadaEm?: Date
}

export function criar(jogador: string, palavraId: number){
    return prisma.partida.create({
        data: {jogador, palavraId},
        include: {palavra:true}
    })
}

export function buscarPorId(id: number){
    return prisma.partida.findUnique({
        where: {id},
        include: {palavra:true}
    })
}

export function atualizar(id: number, dados: DadosPalpite){
  return prisma.partida.update({
    where: {id},
    data: dados,
    include: {palavra: true},
  })
}

export function listarRanking(){
  return prisma.partida.findMany({
    where: {status: 'vitoria'},
    orderBy: [{pontos: 'desc'}, {finalizadaEm: 'asc'}],
    take: 10,
    include: {palavra: true},
  })
}

