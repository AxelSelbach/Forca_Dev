import { useState } from 'react';
import { api, mensagemDeErro } from '../api/cliente';
import { Mascara } from '../components/mascara';
import { Teclado } from '../components/teclado';
import { Vidas } from '../components/vidas';
import type { EstadoPartida } from '../types';

type JogoProps = {
    partida: EstadoPartida
    onAtualizar: (partida: EstadoPartida)=> void
}

export function Jogo({partida, onAtualizar}: JogoProps){
    const [enviando, setEnviando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    async function palpitar(letra: string){
        setEnviando(true)
        setErro(null)

        try{
            onAtualizar(await api.palpitar(partida.id, letra))
        } catch(e){
            setErro(mensagemDeErro(e))
        } finally{
            setEnviando(false)
        }
    }

    return (
        <section className="cartao">
        <div className="jogo-topo">
            <span className="categoria">{partida.categoria}</span>
            <Vidas restantes={partida.vidasRestantes} />
        </div>
        <Mascara mascara={partida.mascara} />
        <Teclado
            tentadas={partida.letrasTentadas}
            mascara={partida.mascara}
            desabilitado={enviando}
            onLetra={palpitar}
        />
        {enviando && <p className="suave centro">Enviando palpite…</p>}
        {erro && (
            <p className="mensagem-erro" role="alert">{erro}</p>
        )}
        <p className="suave centro">
            {partida.jogador} · tentadas: {partida.letrasTentadas.join(' ') || '—'}
        </p>
        </section>
  );

}