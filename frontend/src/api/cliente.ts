import type { EstadoPartida, ItemRanking } from "../types";

const MSG_FORA_DO_AR = 'Servidor fora do ar. Tente novamente em instantes.'

function extrairErro(corpo: unknown): string | null {
    if(
        typeof corpo === 'object' &&
        corpo !== null &&
        'erro' in corpo &&
        typeof corpo.erro === 'string'
    ){
        return corpo.erro
    }

    return null
}

export function mensagemDeErro(e: unknown): string {
    return e instanceof Error ? e.message : 'Erro inesperado'
}

async function requisitar<T>(url: string, init?: RequestInit): Promise<T> {
    let res: Response
    try {
        res = await fetch(url, {
            headers: {'Content-Type': 'application/json'},
            ...init
        })
    } catch {
        throw new Error(MSG_FORA_DO_AR)
    }

    const corpo: unknown = await res.json().catch(()=> null)

    if(!res.ok){
        throw new Error(
            extrairErro(corpo) ?? (res.status >= 500 ? MSG_FORA_DO_AR : 'Erro inesperado')
        )
    }
    return corpo as T
}

export const api = {
    novaPartida: (jogador: string)=>requisitar<EstadoPartida>('/api/partidas', {
        method: 'POST',
        body: JSON.stringify({jogador})
    }),
    palpitar: (id: number, letra: string)=>requisitar<EstadoPartida>(`/api/partidas/${id}/palpites`, {
        method: 'POST',
        body: JSON.stringify({letra})
    }),
    ranking: ()=>requisitar<ItemRanking[]>('api/ranking')
}