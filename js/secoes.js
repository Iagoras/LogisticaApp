/**
 * secoes.js — Renderização das listas do site.
 *
 * Cada função aqui substitui um `<sc-for>` do template original.
 */

import { clientes, servicos, cobertura, passos } from './dados.js';
import { criar, pegar, preencher } from './dom.js';

/** Faixa "OPERAMOS PARA". */
export function renderizarClientes() {
  const alvo = pegar('#lista-clientes');
  preencher(
    alvo,
    clientes.map((nome) => criar('span', { class: 'cliente', text: nome })),
  );
}

/** Grade de soluções. */
export function renderizarServicos() {
  const alvo = pegar('#grade-servicos');

  preencher(
    alvo,
    servicos.map((servico) =>
      criar('article', { class: 'servico' }, [
        criar('div', {
          class: 'servico__numero',
          text: servico.n,
          style: { background: servico.tom },
        }),
        criar('h3', { class: 'servico__titulo', text: servico.titulo }),
        criar('p', { class: 'servico__texto', text: servico.texto }),
        criar('span', { class: 'servico__metrica', text: servico.metrica }),
      ]),
    ),
  );
}

/** Indicadores da seção de cobertura. */
export function renderizarCobertura() {
  const alvo = pegar('#grade-cobertura');

  preencher(
    alvo,
    cobertura.map((item) =>
      criar('div', { class: 'indicador' }, [
        criar('span', { class: 'indicador__valor', text: item.valor }),
        criar('span', { class: 'indicador__rotulo', text: item.rotulo }),
      ]),
    ),
  );
}

/** Os quatro passos do processo. */
export function renderizarPassos() {
  const alvo = pegar('#grade-processo');

  preencher(
    alvo,
    passos.map((passo) =>
      criar('div', { class: 'passo' }, [
        criar('span', { class: 'passo__numero', text: passo.n }),
        criar('h3', { class: 'passo__titulo', text: passo.titulo }),
        criar('p', { class: 'passo__texto', text: passo.texto }),
      ]),
    ),
  );
}

/** Renderiza tudo de uma vez. */
export function renderizarSecoes() {
  renderizarClientes();
  renderizarServicos();
  renderizarCobertura();
  renderizarPassos();
}
