'use client';

import { createContext, useContext, useMemo, useState } from 'react';

import {
  buscarCarga,
  codigosDisponiveis,
  CODIGO_PADRAO,
  type Carga,
} from '@/lib/conteudo-landing';

/* -------------------------------------------------------------------------
   Estado compartilhado entre o painel de rastreio e o cartão do hero
   ------------------------------------------------------------------------- */

type EstadoRastreio = {
  carga: Carga;
  dica: string;
  erro: boolean;
  carregando: boolean;
  consultar: (codigo: string) => void;
};

const Contexto = createContext<EstadoRastreio | null>(null);

function usarRastreio(): EstadoRastreio {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('Use dentro de <ProvedorRastreio>.');
  return ctx;
}

export function ProvedorRastreio({ children }: { children: React.ReactNode }) {
  const inicial = buscarCarga(CODIGO_PADRAO);

  const [carga, setCarga] = useState<Carga>(inicial.carga);
  const [dica, setDica] = useState('Atualizado há poucos segundos.');
  const [erro, setErro] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const sugestao = useMemo(
    () => codigosDisponiveis().find((c) => c !== CODIGO_PADRAO) ?? CODIGO_PADRAO,
    [],
  );

  const consultar = (codigo: string) => {
    if (!codigo.trim()) {
      setDica('Digite um código para rastrear.');
      setErro(true);
      return;
    }

    setCarregando(true);
    setDica('Consultando…');
    setErro(false);

    // Pequeno atraso proposital: dá feedback de que algo aconteceu.
    setTimeout(() => {
      const { ok, carga: encontrada, solicitado } = buscarCarga(codigo);

      setCarga(encontrada);
      setErro(!ok);
      setDica(
        ok
          ? 'Atualizado há poucos segundos.'
          : `Código ${solicitado || '—'} não encontrado — exibindo ${encontrada.codigo}. Tente ${sugestao}.`,
      );
      setCarregando(false);
    }, 420);
  };

  return (
    <Contexto.Provider value={{ carga, dica, erro, carregando, consultar }}>
      {children}
    </Contexto.Provider>
  );
}

/* -------------------------------------------------------------------------
   Cartão flutuante do hero
   ------------------------------------------------------------------------- */

export function CartaoCarga() {
  const { carga } = usarRastreio();

  // No cartão aparecem só as cidades, sem as siglas de estado.
  const rota = carga.rota
    .split('→')
    .map((t) => t.split(',')[0].trim())
    .join(' → ');

  const ultima = carga.etapas[carga.etapas.length - 1];

  return (
    <aside className="cartao-carga" aria-live="polite">
      <div className="cartao-carga__topo">
        <span className="cartao-carga__codigo">CARGA #{carga.codigo}</span>
        <span className="pulso" aria-hidden="true" />
      </div>
      <div className="cartao-carga__rota">{rota}</div>
      <div className="barra">
        <div
          className="barra__preenchimento"
          style={{ width: `${carga.progresso}%` }}
        />
      </div>
      <div className="cartao-carga__rodape">
        <span>{carga.progresso}% do trajeto</span>
        <span className="cartao-carga__eta">
          {carga.progresso >= 100
            ? `Entregue ${ultima.hora}`
            : `Chega ${ultima.hora}`}
        </span>
      </div>
    </aside>
  );
}

/* -------------------------------------------------------------------------
   Seção de rastreio
   ------------------------------------------------------------------------- */

export function SecaoRastreio() {
  const { carga, dica, erro, carregando, consultar } = usarRastreio();
  const [codigo, setCodigo] = useState(CODIGO_PADRAO);

  const ultimaConcluida = carga.etapas.reduce(
    (indice, etapa, i) => (etapa.concluida ? i : indice),
    -1,
  );

  return (
    <section className="rastreio" id="rastreio">
      <div className="rastreio__interno">
        <div className="rastreio__texto">
          <span className="rastreio__olho">RASTREIO EM TEMPO REAL</span>
          <h2 className="rastreio__titulo">Onde está a minha carga?</h2>
          <p className="rastreio__descricao">
            Telemetria a cada 30 segundos, temperatura de câmara fria e
            comprovante digital de entrega no mesmo lugar.
          </p>

          <form
            className="rastreio__form"
            onSubmit={(e) => {
              e.preventDefault();
              consultar(codigo);
            }}
          >
            <label className="sr-only" htmlFor="campo-rastreio">
              Código de rastreio
            </label>
            <input
              id="campo-rastreio"
              className="campo-escuro"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Digite o código, ex: RV-88421"
              autoComplete="off"
            />
            <button type="submit" className="btn btn--limao" disabled={carregando}>
              Rastrear
            </button>
          </form>

          <span
            className={`rastreio__dica${erro ? ' rastreio__dica--erro' : ''}`}
            role="status"
            aria-live="polite"
          >
            {dica}
          </span>
        </div>

        <div className={`painel${carregando ? ' painel--carregando' : ''}`}>
          <div className="painel__topo">
            <div className="painel__identificacao">
              <span className="painel__codigo">{carga.codigo}</span>
              <span className="painel__rota">{carga.rota}</span>
            </div>
            <span className="painel__status">{carga.status}</span>
          </div>

          <ol className="linha-tempo">
            {carga.etapas.map((etapa, i) => {
              const classes = [
                'etapa',
                etapa.concluida ? 'etapa--concluida' : '',
                i === ultimaConcluida ? 'etapa--atual' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <li className={classes} key={etapa.titulo}>
                  <div className="etapa__trilho">
                    <span className="etapa__ponto" />
                    <span className="etapa__linha" />
                  </div>
                  <div className="etapa__conteudo">
                    <span className="etapa__titulo">{etapa.titulo}</span>
                    <span className="etapa__local">{etapa.local}</span>
                  </div>
                  <span className="etapa__hora">{etapa.hora}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
