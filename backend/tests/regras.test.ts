import {describe, it, expect} from 'vitest'
import {
    aplicarPalpite,
    calcularPontos,
    gerarMascara,
    type PartidaJogo
} from '../src/game/regras'
import { ErroApp } from '../src/errors'

function partidaBase(sobrescrever: Partial<PartidaJogo> = {}): PartidaJogo{
    return {
        palavra: 'PROMISE',
        letrasTentadas: [],
        erros: 0,
        status: 'em_andamento',
        pontos: 0,
        ...sobrescrever
    }
}

function erroDe(fn: () => unknown): ErroApp {
  try {
    fn();
  } catch (e) {
    if (e instanceof ErroApp) return e;
    throw e;
  }
  throw new Error('Era esperado que lançasse ErroApp');
}

describe('gerarMascara', () => {
  it('mostra só as letras já tentadas', () => {
    expect(gerarMascara('PROMISE', ['P', 'E'])).toBe('P_____E');
  });

  it('esconde tudo quando nada foi tentado', () => {
    expect(gerarMascara('PROMISE', [])).toBe('_______');
  });
});

describe('calcularPontos (RN06)', () => {
  it('PROMISE com 4 vidas vale 75 pontos', () => {
    expect(calcularPontos('PROMISE', 4)).toBe(75);
  });

  it('conta letras distintas, não letras totais', () => {
    expect(calcularPontos('CALLBACK', 6)).toBe(85);
  });
});

describe('aplicarPalpite', () => {
  it('acerto não consome vida (RN01)', () => {
    const nova = aplicarPalpite(partidaBase(), 'P');
    expect(nova.erros).toBe(0);
    expect(nova.letrasTentadas).toEqual(['P']);
  });

  it('erro consome 1 vida (RN01)', () => {
    const nova = aplicarPalpite(partidaBase(), 'Z');
    expect(nova.erros).toBe(1);
  });

  it('converte minúscula para maiúscula (RN02)', () => {
    const nova = aplicarPalpite(partidaBase(), 'p');
    expect(nova.letrasTentadas).toEqual(['P']);
  });

  it.each(['ab', '1', '', 'ç'])('recusa "%s" com 400 (RN02)', (valor) => {
    expect(erroDe(() => aplicarPalpite(partidaBase(), valor)).status).toBe(400);
  });

  it('letra repetida responde 409 (RN03)', () => {
    const partida = partidaBase({ letrasTentadas: ['Z'], erros: 1 });
    expect(erroDe(() => aplicarPalpite(partida, 'Z')).status).toBe(409);
  });

  it('partida encerrada não aceita palpite (RN04)', () => {
    const partida = partidaBase({ status: 'derrota', erros: 6 });
    expect(erroDe(() => aplicarPalpite(partida, 'P')).status).toBe(409);
  });

  it('vitória ao revelar a palavra, com pontos (RN05/RN06)', () => {
    const partida = partidaBase({
      letrasTentadas: ['P', 'R', 'O', 'M', 'I', 'S'],
      erros: 2,
    });
    const nova = aplicarPalpite(partida, 'E');
    expect(nova.status).toBe('vitoria');
    expect(nova.pontos).toBe(75);
  });

  it('derrota quando as vidas chegam a 0, sem pontos (RN05/RN06)', () => {
    const partida = partidaBase({ letrasTentadas: ['A', 'B', 'C', 'D', 'F'], erros: 5 });
    const nova = aplicarPalpite(partida, 'Z');
    expect(nova.status).toBe('derrota');
    expect(nova.pontos).toBe(0);
  });

  it('não altera a partida recebida (função pura)', () => {
    const partida = partidaBase();
    aplicarPalpite(partida, 'Z');
    expect(partida.erros).toBe(0);
    expect(partida.letrasTentadas).toEqual([]);
  });
});