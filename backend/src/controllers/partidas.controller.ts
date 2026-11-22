import type { FastifyReply, FastifyRequest } from "fastify";
import {
    idSchema,
    novaPartidaSchema,
    palpiteSchema
} from '../schemas/partida.schemas'
import * as service from '../services/partidas.service'

export async function criar(req: FastifyRequest, rep: FastifyReply){
    const {jogador} = novaPartidaSchema.parse(req.body)
    const partida = await service.criarPartida(jogador)
    return rep.status(201).send(partida)
}

export async function buscar(req: FastifyRequest){
    const {id} = idSchema.parse(req.params)
    return service.buscarPartida(id)
}

export async function palpitar(req: FastifyRequest){
    const {id} = idSchema.parse(req.params)
    const {letra} = palpiteSchema.parse(req.body)
    return service.palpitar(id, letra)
}

export async function ranking(){
    return service.listarRanking()
}