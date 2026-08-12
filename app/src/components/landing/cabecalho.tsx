'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const LINKS = [
  { href: '#solucoes', texto: 'Soluções' },
  { href: '#rastreio', texto: 'Rastreio' },
  { href: '#cobertura', texto: 'Cobertura' },
  { href: '#processo', texto: 'Como funciona' },
];

export function Cabecalho({ logado }: { logado: boolean }) {
  const [aberto, setAberto] = useState(false);

  // Fecha o menu ao passar para o tamanho desktop — senão fica preso aberto.
  useEffect(() => {
    const media = window.matchMedia('(min-width: 981px)');
    const aoMudar = (e: MediaQueryListEvent) => e.matches && setAberto(false);
    media.addEventListener('change', aoMudar);
    return () => media.removeEventListener('change', aoMudar);
  }, []);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false);
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, []);

  return (
    <header className="cabecalho">
      <Link href="/" className="marca">
        <span className="marca__icone" aria-hidden="true">
          T
        </span>
        <span className="marca__nome">TCA Move</span>
      </Link>

      <nav
        id="nav-principal"
        className={`nav${aberto ? ' aberto' : ''}`}
        aria-label="Navegação principal"
        onClick={(e) => {
          if ((e.target as HTMLElement).tagName === 'A') setAberto(false);
        }}
      >
        {LINKS.map((l) => (
          <a key={l.href} href={l.href}>
            {l.texto}
          </a>
        ))}
        <Link href={logado ? '/painel' : '/cadastrar'} className="btn btn--pilula nav__cta">
          {logado ? 'Ir para o painel' : 'Solicitar cotação'}
        </Link>
      </nav>

      <div className="cabecalho__acoes">
        <Link href={logado ? '/painel' : '/entrar'} className="link-entrar">
          {logado ? 'Painel' : 'Entrar'}
        </Link>
        <Link
          href={logado ? '/painel/produtos' : '/cadastrar'}
          className="btn btn--pilula"
        >
          {logado ? 'Meu estoque' : 'Solicitar cotação'}
        </Link>
        <button
          type="button"
          className="menu-toggle"
          aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={aberto}
          aria-controls="nav-principal"
          onClick={() => setAberto((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
