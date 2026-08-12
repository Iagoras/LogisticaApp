/**
 * interface.js — Comportamentos de interface.
 *
 * Menu mobile, rolagem suave, link de navegação ativo, contagem dos
 * números do hero, animação de entrada das seções e o formulário de cotação.
 */

import { numerosHero } from './dados.js';
import { criar, pegar, pegarTodos, formatarNumero, prefereMenosMovimento } from './dom.js';

/* --------------------------------------------------------------------------
   Menu mobile
   -------------------------------------------------------------------------- */

export function iniciarMenu() {
  const botao = pegar('#menu-toggle');
  const nav = pegar('#nav-principal');
  if (!botao || !nav) return;

  function fechar() {
    nav.classList.remove('aberto');
    botao.setAttribute('aria-expanded', 'false');
  }

  botao.addEventListener('click', () => {
    const aberto = nav.classList.toggle('aberto');
    botao.setAttribute('aria-expanded', String(aberto));
  });

  // Fecha ao clicar num link ou ao apertar Esc.
  nav.addEventListener('click', (evento) => {
    if (evento.target.tagName === 'A') fechar();
  });

  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') fechar();
  });

  // Se a janela voltar ao tamanho desktop, o menu não pode ficar preso aberto.
  window.matchMedia('(min-width: 981px)').addEventListener('change', (e) => {
    if (e.matches) fechar();
  });
}

/* --------------------------------------------------------------------------
   Rolagem suave
   -------------------------------------------------------------------------- */

export function iniciarRolagemSuave() {
  document.addEventListener('click', (evento) => {
    const link = evento.target.closest('a[href^="#"]');
    if (!link) return;

    const id = link.getAttribute('href');
    if (!id || id === '#') return;

    const destino = document.querySelector(id);
    if (!destino) return;

    evento.preventDefault();
    destino.scrollIntoView({
      behavior: prefereMenosMovimento() ? 'auto' : 'smooth',
      block: 'start',
    });

    // Mantém o histórico coerente sem provocar um segundo salto.
    history.replaceState(null, '', id);
  });
}

/* --------------------------------------------------------------------------
   Link ativo na navegação
   -------------------------------------------------------------------------- */

export function iniciarNavegacaoAtiva() {
  const links = pegarTodos('#nav-principal a[href^="#"]');
  if (!links.length || !('IntersectionObserver' in window)) return;

  const porId = new Map(
    links.map((link) => [link.getAttribute('href').slice(1), link]),
  );

  const secoes = Array.from(porId.keys())
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        links.forEach((l) => l.classList.remove('ativo'));
        porId.get(entrada.target.id)?.classList.add('ativo');
      });
    },
    // A faixa estreita no meio da tela evita que duas seções disputem o destaque.
    { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
  );

  secoes.forEach((secao) => observador.observe(secao));
}

/* --------------------------------------------------------------------------
   Números do hero
   -------------------------------------------------------------------------- */

/** Anima de 0 até o valor final com easing suave. */
function contar(elemento, alvo, decimais, sufixo) {
  if (prefereMenosMovimento()) {
    elemento.textContent = formatarNumero(alvo, decimais) + sufixo;
    return;
  }

  const duracao = 1400;
  const inicio = performance.now();

  function passo(agora) {
    const progresso = Math.min((agora - inicio) / duracao, 1);
    const suave = 1 - Math.pow(1 - progresso, 3); // easeOutCubic
    elemento.textContent = formatarNumero(alvo * suave, decimais) + sufixo;

    if (progresso < 1) requestAnimationFrame(passo);
  }

  requestAnimationFrame(passo);
}

export function renderizarNumeros() {
  const alvo = pegar('#hero-numeros');
  if (!alvo) return;

  const elementos = numerosHero.map((item) => {
    const valor = criar('span', {
      class: 'numero__valor',
      text: formatarNumero(0, item.decimais) + item.sufixo,
    });

    const bloco = criar('div', { class: 'numero' }, [
      valor,
      criar('span', { class: 'numero__rotulo', text: item.rotulo }),
    ]);

    return { bloco, valor, item };
  });

  alvo.replaceChildren(...elementos.map((e) => e.bloco));

  const finalizar = () =>
    elementos.forEach(({ valor, item }) =>
      contar(valor, item.valor, item.decimais, item.sufixo),
    );

  // Sem animação (ou sem observer), mostra o valor final de imediato — senão
  // quem nunca rola até o bloco ficaria vendo zero.
  if (prefereMenosMovimento() || !('IntersectionObserver' in window)) {
    finalizar();
    return;
  }

  const observador = new IntersectionObserver(
    (entradas, obs) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        elementos.forEach(({ valor, item }) =>
          contar(valor, item.valor, item.decimais, item.sufixo),
        );
        obs.disconnect();
      });
    },
    { threshold: 0.4 },
  );

  observador.observe(alvo);
}

/* --------------------------------------------------------------------------
   Animação de entrada
   -------------------------------------------------------------------------- */

export function iniciarRevelacao() {
  const alvos = pegarTodos('.revelar');
  if (!alvos.length) return;

  if (!('IntersectionObserver' in window) || prefereMenosMovimento()) {
    alvos.forEach((el) => el.classList.add('revelar--visivel'));
    return;
  }

  const observador = new IntersectionObserver(
    (entradas, obs) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add('revelar--visivel');
        obs.unobserve(entrada.target);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' },
  );

  alvos.forEach((el) => observador.observe(el));
}

/* --------------------------------------------------------------------------
   Cartão flutuante do hero
   -------------------------------------------------------------------------- */

/** Sincroniza o cartão do hero com a carga exibida no painel de rastreio. */
export function atualizarCartaoHero(carga) {
  const codigo = pegar('#cartao-codigo');
  const rota = pegar('#cartao-rota');
  const barra = pegar('#cartao-barra');
  const percentual = pegar('#cartao-percentual');
  const eta = pegar('#cartao-eta');
  if (!codigo) return;

  codigo.textContent = `CARGA #${carga.codigo}`;

  // O cartão mostra só as cidades, sem as siglas de estado.
  rota.textContent = carga.rota
    .split('→')
    .map((trecho) => trecho.split(',')[0].trim())
    .join(' → ');

  requestAnimationFrame(() => {
    barra.style.width = `${carga.progresso}%`;
  });
  percentual.textContent = `${carga.progresso}% do trajeto`;

  const ultima = carga.etapas[carga.etapas.length - 1];
  eta.textContent =
    carga.progresso >= 100 ? `Entregue ${ultima.hora}` : `Chega ${ultima.hora}`;
}

/* --------------------------------------------------------------------------
   Formulário de cotação
   -------------------------------------------------------------------------- */

export function iniciarContato() {
  const form = pegar('#form-contato');
  const campo = pegar('#campo-email');
  const aviso = pegar('#aviso-contato');
  if (!form || !campo) return;

  form.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const email = campo.value.trim();

    // Validação simples: o navegador já faz o resto via type="email".
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      aviso.textContent = 'Informe um e-mail corporativo válido.';
      aviso.classList.add('contato__aviso--erro');
      campo.focus();
      return;
    }

    aviso.textContent = 'Recebido! Nosso time responde em até 24h.';
    aviso.classList.remove('contato__aviso--erro');
    form.reset();
  });
}
