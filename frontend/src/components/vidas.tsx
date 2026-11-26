type VidaProps = {
    restantes: number
    total?: number
}

export function Vidas({restantes, total = 6}: VidaProps){
    return (
        <div className="vidas" aria-label={`${restantes} de ${total} vidas`}>
            {Array.from({length: total}, (_, i)=>(
                <span key={i} className={i < restantes ? 'coracao cheio' : 'coracao vazio'}>
                    {i < restantes ? '♥' : '♡'}
                </span>
            ))}
            <span className="vidas-texto">{restantes} vidas</span>
        </div>
    )
}