import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { sair } from '../(auth)/acoes';

export default async function LayoutPainel({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessao = await auth();

  // O middleware já barra, mas o layout confere de novo: o dado da sessão
  // é usado abaixo e não pode ser assumido.
  if (!sessao?.user) redirect('/entrar');

  return (
    <div className="min-h-screen bg-[#F5F7F3]">
      <header className="sticky top-0 z-40 border-b border-slate-900/8 bg-[#F5F7F3]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <div className="flex items-center gap-8">
            <Link href="/painel" className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-lime-400 to-emerald-600 text-base font-bold text-emerald-950">
                T
              </span>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                TCA Move
              </span>
            </Link>

            <nav className="hidden items-center gap-6 text-[15px] font-medium text-slate-600 sm:flex">
              <Link href="/painel" className="transition hover:text-emerald-600">
                Visão geral
              </Link>
              <Link
                href="/painel/produtos"
                className="transition hover:text-emerald-600"
              >
                Estoque
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-[14px] text-slate-600 md:inline">
              {sessao.user.name}
            </span>
            <form action={sair}>
              <button
                type="submit"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[14px] font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-8 md:py-12">
        {children}
      </main>
    </div>
  );
}
