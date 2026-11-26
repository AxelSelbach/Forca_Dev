type MascaraProps = {
    mascara: string
}

export function Mascara({mascara}: MascaraProps){
    return(
        <div className="mascara" aria-label={`Palavra: ${[...mascara].join(' ')}`}>
            {[...mascara].map((letra, i)=>(
                <span key={i} className={letra ==='_' ? 'casa vazia' : 'casa'}>
                    {letra === '_' ? '' : letra}
                </span>
            ))}
        </div>
    )
}