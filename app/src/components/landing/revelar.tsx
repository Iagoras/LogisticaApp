'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Revela o conteúdo ao entrar na tela.
 *
 * Com `prefers-reduced-motion` (ou sem IntersectionObserver) aparece já
 * visível, para o conteúdo nunca ficar preso invisível.
 */
export function Revelar({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const alvo = useRef<HTMLDivElement>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const menosMovimento = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (menosMovimento || !('IntersectionObserver' in window)) {
      setVisivel(true);
      return;
    }

    const el = alvo.current;
    if (!el) return;

    const observador = new IntersectionObserver(
      (entradas, obs) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue;
          setVisivel(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' },
    );

    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return (
    <div
      ref={alvo}
      className={`revelar${visivel ? ' revelar--visivel' : ''} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
