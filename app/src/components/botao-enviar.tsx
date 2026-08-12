'use client';

import { useFormStatus } from 'react-dom';

/**
 * Botão de envio que se desabilita sozinho durante o POST.
 * Precisa estar dentro do <form> para o `useFormStatus` funcionar.
 */
export function BotaoEnviar({
  children,
  carregando,
}: {
  children: React.ReactNode;
  carregando?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-progress disabled:opacity-70"
    >
      {pending ? (carregando ?? 'Enviando…') : children}
    </button>
  );
}
