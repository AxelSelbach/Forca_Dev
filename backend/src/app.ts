import Fastify from "fastify";
import type { FastifyError } from "fastify";
import cors from "@fastify/cors";
import { ZodError } from "zod";
import { rotasPartidas } from "./routes/partidas.routes";
import { ErroApp } from "./errors";

export function criarApp(){
    const app = Fastify()

    app.register(cors)
    app.register(rotasPartidas, {prefix: '/api'})
    app.setErrorHandler((err: FastifyError, _req, rep)=>{
        if(err instanceof ZodError){
            return rep.status(400).send({erro: 'Dados inválidos', detalhes: err.issues})
        }

        if(err instanceof ErroApp){
            return rep.status(err.status).send({erro: err.message})
        }

        if(err.statusCode && err.statusCode < 500){
            return rep.status(err.statusCode).send({erro: err.message})
        }
        console.error(err)
        return rep.status(500).send({erro: 'Erro interno'})
    })

    app.setNotFoundHandler((_req, rep)=>
        rep.status(404).send({erro: 'Rota não encontrada'})
    )
    return app
}