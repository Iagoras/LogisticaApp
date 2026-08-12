import type { Metadata } from 'next';
import { FormularioCadastro } from './formulario';

export const metadata: Metadata = {
  title: 'Cadastrar empresa · TCA Move',
  description: 'Cadastre sua empresa como fornecedora na TCA Move.',
};

export default function PaginaCadastrar() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Cadastre sua empresa
        </h1>
        <p className="text-[15px] text-slate-600">
          Depois do cadastro você já pode registrar os itens do seu estoque.
        </p>
      </div>

      <FormularioCadastro />
    </div>
  );
}
