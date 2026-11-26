import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, mensagemDeErro } from "../api/cliente";
import { Ranking } from "../components/ranking";
import type { EstadoPartida, ItemRanking } from "../types";

type InicioProps = {
    onIniciar: (partida: EstadoPartida) => void
}

export function Inicio({onIniciar}: InicioProps){
    const [apelido, setApelido] = useState('')
    const [enviando, setEnviando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    const [ranking, setRanking] = useState<ItemRanking[]>([])
    const [carregandoRanking, setCarregandoRanking] = useState(true)
    const [erroRanking, setErroRanking] = useState<string | null>(null)

    const apelidoLimpo = apelido.trim()
    const apelidoValido = apelidoLimpo.length >= 3 && apelidoLimpo.length <= 20

    useEffect(()=>{
        let ativo = true
        api.ranking().then((r)=>{
            if(ativo) setRanking(r)
        })
        .catch((e: unknown)=> {
            if(ativo) setErroRanking(mensagemDeErro(e))
        })
        .finally(()=>{
            if(ativo) setCarregandoRanking(false)
        })
    return ()=>{
        ativo = false
    }
    }, [])

    async function aoEnviar(e: FormEvent){
        e.preventDefault()
        if(!apelidoValido || enviando) return
        setEnviando(true)
        setErro(null)
        try {
            onIniciar(await api.novaPartida(apelidoLimpo))
        } catch(err){
            setErro(mensagemDeErro(err))
            setEnviando(false)
        }
    }

    return (
        <>
            <section className="cartao">
                <h2>Novo jogo</h2>
                <form onSubmit={aoEnviar}>
                    <label htmlFor="apelido">Apelido</label>
                    <input 
                        id="apelido"
                        value={apelido}
                        onChange={(e)=>setApelido(e.target.value)}
                        placeholder="ex.: ana"
                        autoComplete="off"
                    />
                    <p className="dica">De 3 a 20 caracteres.</p>
                    <button className="botao" type="submit" disabled={!apelidoValido || enviando}>
                        {enviando ? 'Criando partida...' : 'Jogar'}
                    </button>
                </form>
                {erro && (
                    <p className="mensagem-erro" role="alert">{erro}</p>
                )}
            </section>

            <section className="cartao">
                <h2>Ranking · Top 10</h2>
                {carregandoRanking && <p className="suave">Carregando ranking...</p>}
                {erroRanking && (
                    <p className="mensagem-erro" role="alert">{erroRanking}</p>
                )}
                {!carregandoRanking && !erroRanking && <Ranking itens={ranking} />}
            </section>
        </>
    )
}