import Link from 'next/link';

import { criarProduto } from '../acoes';
import { FormularioProduto } from '../formulario';

export const metadata = { title: 'Novo produto · TCA Move' };

export default function PaginaNovoProduto() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link
          href="/painel/produtos"
          className="text-[14px] font-medium text-slate-600 hover:text-emerald-700"
        >
          ← Voltar ao estoque
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Novo produto
        </h1>
      </div>

      <FormularioProduto acao={criarProduto} rotuloEnvio="Cadastrar produto" />
    </div>
  );
}
