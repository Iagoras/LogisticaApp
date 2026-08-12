/**
 * app.js — Ponto de entrada.
 *
 * Ordem importa pouco aqui, mas o rastreio vem por último porque ele
 * dispara a primeira consulta e alimenta o cartão flutuante do hero.
 */

import { renderizarSecoes } from './secoes.js';
import { iniciarRastreio } from './rastreio.js';
import {
  iniciarMenu,
  iniciarRolagemSuave,
  iniciarNavegacaoAtiva,
  renderizarNumeros,
  iniciarRevelacao,
  iniciarContato,
  atualizarCartaoHero,
} from './interface.js';

function iniciar() {
  renderizarSecoes();
  renderizarNumeros();

  iniciarMenu();
  iniciarRolagemSuave();
  iniciarNavegacaoAtiva();
  iniciarContato();
  iniciarRevelacao();

  iniciarRastreio({ aoAtualizar: atualizarCartaoHero });

  // Ano do rodapé sempre atual.
  const ano = document.getElementById('ano-atual');
  if (ano) ano.textContent = String(new Date().getFullYear());
}

// `type="module"` já adia a execução, mas a guarda cobre o caso de
// o script ser carregado de outra forma.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciar);
} else {
  iniciar();
}
