/**
 * rastreio.js — Busca de carga e linha do tempo.
 *
 * Equivale ao `state`/`onTrack` do componente original: mantém o código
 * consultado, chama a fonte de dados e redesenha o painel.
 */

import { buscarRastreio, codigosDisponiveis, CODIGO_PADRAO } from './dados.js';
import { criar, pegar, preencher } from './dom.js';

/**
 * Monta as etapas da linha do tempo.
 *
 * A "atual" é a última etapa concluída — é ela que ganha o ponto verde-limão,
 * como no design. As demais concluídas ficam verde-água; as pendentes, apagadas.
 */
function montarEtapas(etapas) {
  const ultimaConcluida = etapas.reduce(
    (indice, etapa, i) => (etapa.concluida ? i : indice),
    -1,
  );

  return etapas.map((etapa, i) => {
    let modificador = '';
    if (i === ultimaConcluida) {
      modificador = ' etapa--atual';
    } else if (etapa.concluida) {
      modificador = ' etapa--concluida';
    }

    const trilho = criar('div', { class: 'etapa__trilho' }, [
      criar('span', { class: 'etapa__ponto' }),
      criar('span', { class: 'etapa__linha' }),
    ]);

    const conteudo = criar('div', { class: 'etapa__conteudo' }, [
      criar('span', { class: 'etapa__titulo', text: etapa.titulo }),
      criar('span', { class: 'etapa__local', text: etapa.local }),
    ]);

    // A etapa atual também recebe a classe de concluída para herdar cor da linha.
    const classes = `etapa${etapa.concluida ? ' etapa--concluida' : ''}${modificador}`;

    return criar('li', { class: classes }, [
      trilho,
      conteudo,
      criar('span', { class: 'etapa__hora', text: etapa.hora }),
    ]);
  });
}

/** Desenha o painel inteiro com os dados de uma carga. */
function desenharPainel(refs, carga) {
  refs.codigo.textContent = carga.codigo;
  refs.rota.textContent = carga.rota;
  refs.status.textContent = carga.status;
  preencher(refs.linhaTempo, montarEtapas(carga.etapas));
}

/**
 * Inicializa a seção de rastreio.
 * @param {object} [opcoes]
 * @param {(carga: object) => void} [opcoes.aoAtualizar] Callback para o cartão do hero.
 */
export function iniciarRastreio({ aoAtualizar } = {}) {
  const form = pegar('#form-rastreio');
  const campo = pegar('#campo-rastreio');
  const botao = pegar('#botao-rastreio');
  const dica = pegar('#dica-rastreio');
  const painel = pegar('#painel-rastreio');

  if (!form || !campo || !painel) return;

  const refs = {
    codigo: pegar('#painel-codigo'),
    rota: pegar('#painel-rota'),
    status: pegar('#painel-status'),
    linhaTempo: pegar('#linha-tempo'),
  };

  const disponiveis = codigosDisponiveis();
  const sugestao = disponiveis.find((c) => c !== CODIGO_PADRAO) || CODIGO_PADRAO;

  let carregando = false;

  async function consultar(codigo) {
    if (carregando) return;

    carregando = true;
    painel.classList.add('painel--carregando');
    if (botao) botao.disabled = true;
    dica.textContent = 'Consultando…';
    dica.classList.remove('rastreio__dica--erro');

    try {
      const { ok, carga, solicitado } = await buscarRastreio(codigo);

      desenharPainel(refs, carga);

      if (ok) {
        dica.textContent = 'Atualizado há poucos segundos.';
        dica.classList.remove('rastreio__dica--erro');
      } else {
        dica.textContent = `Código ${solicitado || '—'} não encontrado — exibindo ${carga.codigo}. Tente ${sugestao}.`;
        dica.classList.add('rastreio__dica--erro');
      }

      if (typeof aoAtualizar === 'function') aoAtualizar(carga);
    } catch (erro) {
      console.error('Falha ao consultar rastreio:', erro);
      dica.textContent = 'Não foi possível consultar agora. Tente novamente.';
      dica.classList.add('rastreio__dica--erro');
    } finally {
      carregando = false;
      painel.classList.remove('painel--carregando');
      if (botao) botao.disabled = false;
    }
  }

  form.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const valor = campo.value.trim();

    if (!valor) {
      dica.textContent = 'Digite um código para rastrear.';
      dica.classList.add('rastreio__dica--erro');
      campo.focus();
      return;
    }

    consultar(valor);
  });

  // Estado inicial do painel.
  campo.value = CODIGO_PADRAO;
  consultar(CODIGO_PADRAO);

  return { consultar };
}
