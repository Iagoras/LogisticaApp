import Link from 'next/link';

/** Moldura das telas de entrar/cadastrar. */
export default function LayoutAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F5F7F3]">
      <header className="border-b border-slate-900/8 bg-[#F5F7F3]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-lime-400 to-emerald-600 text-base font-bold text-emerald-950">
              T
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              TCA Move
            </span>
          </Link>
          <Link
            href="/"
            className="text-[15px] font-medium text-slate-600 transition hover:text-emerald-600"
          >
            Voltar ao site
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-10 md:py-16">
        {children}
      </main>
    </div>
  );
}
