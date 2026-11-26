import { Mascara } from '../components/mascara';
import type { EstadoPartida } from '../types';

type FimProps = {
    partida: EstadoPartida
    onNovo: () => void
}

export function Fim({partida, onNovo}: FimProps){
    const venceu = partida.status === 'vitoria'

    return (
        <section className={`cartao fim ${partida.status}`}>
            <h2>{venceu ? 'Vitória!' : 'Derrota'}</h2>
            <p className='suave'>
                {venceu ? 'Você revelou a palavra.' : 'As vidas acabaram'}
            </p>
            <Mascara mascara={partida.palavra ?? partida.mascara} />
            <p className='suave'>Categoria: {partida.categoria}</p>
            <p className='pontos'>{partida.pontos} pontos</p>
            <button className='botao' onClick={onNovo}>
                Jogar de novo
            </button>
        </section>
    )
}