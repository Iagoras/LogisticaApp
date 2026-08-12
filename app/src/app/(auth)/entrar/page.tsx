import type { Metadata } from 'next';
import { FormularioLogin } from './formulario';

export const metadata: Metadata = {
  title: 'Entrar · TCA Move',
  description: 'Acesse o painel de fornecedores da TCA Move.',
};

export default async function PaginaEntrar({
  searchParams,
}: {
  searchParams: Promise<{ proximo?: string }>;
}) {
  const { proximo } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Acesse sua conta
        </h1>
        <p className="text-[15px] text-slate-600">
          Entre para gerenciar o estoque da sua empresa.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-900/8 bg-white p-6 shadow-sm md:p-8">
        <FormularioLogin proximo={proximo} />
      </div>
    </div>
  );
}
