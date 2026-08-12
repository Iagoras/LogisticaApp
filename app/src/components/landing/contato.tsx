'use client';

import { useState } from 'react';

export function FormularioContato() {
  const [email, setEmail] = useState('');
  const [aviso, setAviso] = useState('');
  const [erro, setErro] = useState(false);

  return (
    <div className="contato" id="contato">
      <h3 className="contato__titulo">Receba uma cotação em 24h</h3>
      <p className="contato__texto">
        Conte o volume mensal e as rotas críticas. Devolvemos um desenho de
        malha com custo por entrega.
      </p>

      <form
        className="contato__form"
        onSubmit={(e) => {
          e.preventDefault();
          const valor = email.trim();

          if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor)) {
            setAviso('Informe um e-mail corporativo válido.');
            setErro(true);
            return;
          }

          setAviso('Recebido! Nosso time responde em até 24h.');
          setErro(false);
          setEmail('');
        }}
      >
        <label className="sr-only" htmlFor="campo-email">
          E-mail corporativo
        </label>
        <input
          id="campo-email"
          className="campo-escuro"
          type="email"
          autoComplete="email"
          placeholder="E-mail corporativo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className="btn btn--limao">
          Solicitar cotação
        </button>
      </form>

      <span
        className={`contato__aviso${erro ? ' contato__aviso--erro' : ''}`}
        role="status"
        aria-live="polite"
      >
        {aviso}
      </span>
    </div>
  );
}
