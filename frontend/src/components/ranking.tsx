import type { ItemRanking } from "../types";

type RankingProps = {
    itens: ItemRanking[]
}

export function Ranking({itens}: RankingProps){
    if(itens.length === 0){
        return <p className="suave">Ninguém venceu ainda. Seja o primeiro</p>
    }

    return (
        <div className="tabela-wrap">
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Jogador</th>
                        <th>Palavra</th>
                        <th className="num">Pontos</th>
                        <th>Data</th>
                    </tr>
                </thead>
                <tbody>
                    {itens.map((item, i)=> (
                        <tr key={`${item.finalizadaEm}-${item.jogador}`}>
                            <td>{i + 1}</td>
                            <td>{item.jogador}</td>
                            <td>{item.palavra}</td>
                            <td className="num">{item.pontos}</td>
                            <td>{new Date(item.finalizadaEm).toLocaleDateString('pt-BR')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}