/**
 * dom.js — Auxiliares mínimos de DOM.
 *
 * Nada de framework: só o suficiente para criar elementos sem repetir
 * `document.createElement` a cada linha. Como o conteúdo é montado com
 * `textContent` (nunca `innerHTML`), não há risco de injeção de HTML.
 */

/**
 * Cria um elemento.
 *
 * @param {string} tag
 * @param {object} [attrs]   Atributos; `class`, `text` e `style` têm tratamento especial.
 * @param {Array<Node|string>} [filhos]
 * @returns {HTMLElement}
 */
export function criar(tag, attrs = {}, filhos = []) {
  const el = document.createElement(tag);

  for (const [chave, valor] of Object.entries(attrs)) {
    if (valor === null || valor === undefined || valor === false) continue;

    if (chave === 'class') {
      el.className = valor;
    } else if (chave === 'text') {
      el.textContent = valor;
    } else if (chave === 'style' && typeof valor === 'object') {
      Object.assign(el.style, valor);
    } else if (chave.startsWith('on') && typeof valor === 'function') {
      el.addEventListener(chave.slice(2).toLowerCase(), valor);
    } else {
      el.setAttribute(chave, valor);
    }
  }

  for (const filho of filhos) {
    if (filho === null || filho === undefined) continue;
    el.append(filho);
  }

  return el;
}

/** `querySelector` encurtado. */
export function pegar(seletor, escopo = document) {
  return escopo.querySelector(seletor);
}

/** `querySelectorAll` já como array. */
export function pegarTodos(seletor, escopo = document) {
  return Array.from(escopo.querySelectorAll(seletor));
}

/** Substitui todo o conteúdo de um container por uma lista de nós. */
export function preencher(container, nos) {
  if (!container) return;
  container.replaceChildren(...nos);
}

/** Formata número no padrão brasileiro (1.860, 98,4). */
export function formatarNumero(valor, decimais = 0) {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  });
}

/** Respeita a preferência de sistema por menos animação. */
export function prefereMenosMovimento() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
