'use client';

import { useEffect, useRef, useState } from 'react';
import { numerosHero } from '@/lib/conteudo-landing';

const formatar = (valor: number, casas: number) =>
  valor.toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });

/**
 * Números do hero com contagem animada ao entrar na tela.
 *
 * Com `prefers-reduced-motion` o valor final aparece de imediato, sem
 * depender do IntersectionObserver — senão quem nunca rola até o bloco
 * ficaria vendo zero para sempre.
 */
export function NumerosHero() {
  const container = useRef<HTMLDivElement>(null);
  const [valores, setValores] = useState(() =>
    numerosHero.map((n) => formatar(0, n.decimais) + n.sufixo),
  );

  useEffect(() => {
    const finalizar = () =>
      setValores(numerosHero.map((n) => formatar(n.valor, n.decimais) + n.sufixo));

    const menosMovimento = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (menosMovimento || !('IntersectionObserver' in window)) {
      finalizar();
      return;
    }

    const alvo = container.current;
    if (!alvo) return;

    let quadro = 0;

    const animar = () => {
      const duracao = 1400;
      const inicio = performance.now();

      const passo = (agora: number) => {
        const progresso = Math.min((agora - inicio) / duracao, 1);
        const suave = 1 - Math.pow(1 - progresso, 3); // easeOutCubic

        setValores(
          numerosHero.map(
            (n) => formatar(n.valor * suave, n.decimais) + n.sufixo,
          ),
        );

        if (progresso < 1) quadro = requestAnimationFrame(passo);
      };

      quadro = requestAnimationFrame(passo);
    };

    const observador = new IntersectionObserver(
      (entradas, obs) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue;
          animar();
          obs.disconnect();
        }
      },
      { threshold: 0.4 },
    );

    observador.observe(alvo);

    return () => {
      observador.disconnect();
      cancelAnimationFrame(quadro);
    };
  }, []);

  return (
    <div className="hero__numeros" ref={container}>
      {numerosHero.map((n, i) => (
        <div className="numero" key={n.rotulo}>
          <span className="numero__valor">{valores[i]}</span>
          <span className="numero__rotulo">{n.rotulo}</span>
        </div>
      ))}
    </div>
  );
}
