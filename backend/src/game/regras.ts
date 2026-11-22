import { ErroApp } from "../erros";
import type { StatusPartida } from "../types";

export const VIDAS_INICIAIS = 6

export interface PartidaJogo {
    palavra: string
    letrasTentadas: string[]
    erros: number
    status: StatusPartida
    pontos: number
}

export function gerarMascara(palavra: string, tentadas: string[]):string{
    return [...palavra].map((l) => (tentadas.includes(l) ? l : '_')).join("")
}

export function calcularPontos(palavra: string, vidasRestantes: number):number{
    return vidasRestantes * 10 + new Set(palavra).size * 5
}

export function palavraRevelada(palavra: string, tentadas: string[]): boolean {
    return [...palavra].every((l) => tentadas.includes(l))
}

export function aplicarPalpite(partida: PartidaJogo, letra: string):PartidaJogo{
    const l = letra.toUpperCase()

    if(!/^[A-Z]$/.test(l)) {
        throw new ErroApp('Envie uma única letra de A a Z', 400)
    }
    if(partida.status !== 'em_andamento'){
        throw new ErroApp('Partida já encerrada', 409)
    }
    if(partida.letrasTentadas.includes(l)){
        throw new ErroApp('Letra já tentada', 409)
    }

    const letrasTentadas = [...partida.letrasTentadas, l]
    const acertou = partida.palavra.includes(l)
    const erros = acertou ? partida.erros : partida.erros + 1
    const vidasRestantes = VIDAS_INICIAIS - erros

    let status: StatusPartida = 'em_andamento'
    let pontos = 0

    if(palavraRevelada(partida.palavra, letrasTentadas)){
        status = 'vitoria'
        pontos = calcularPontos(partida.palavra, vidasRestantes)
    }else if(vidasRestantes <= 0){
        status = 'derrota'
    }

    return {...partida, letrasTentadas, erros, status, pontos }
}