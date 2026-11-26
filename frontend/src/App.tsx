import { useState } from 'react';
import { Fim } from './pages/Fim';
import { Inicio } from './pages/Inicio';
import { Jogo } from './pages/Jogo';
import type { EstadoPartida } from './types';

function App() {
  const [partida, setPartida] = useState<EstadoPartida | null>(null);

  return (
    <main className="app">
      <header className="topo">
        <h1>
          Forca<span>.dev</span>
        </h1>
      </header>
      {partida === null && <Inicio onIniciar={setPartida} />}
      {partida?.status === 'em_andamento' && (
        <Jogo partida={partida} onAtualizar={setPartida} />
      )}
      {partida !== null && partida.status !== 'em_andamento' && (
        <Fim partida={partida} onNovo={() => setPartida(null)} />
      )}
    </main>
  );
}

export default App;