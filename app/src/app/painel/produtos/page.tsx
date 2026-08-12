import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { excluirProduto } from './acoes';

export const metadata = { title: 'Estoque · TCA Move' };

const numero = (valor: unknown, casas: number) =>
  Number(valor).toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });

export default async function PaginaProdutos() {
  const sessao = await auth();
  const fornecedorId = sessao?.user?.fornecedorId;

  if (!fornecedorId) redirect('/entrar');

  const produtos = await prisma.produto.findMany({
    where: { fornecedorId },
    orderBy: { criadoEm: 'desc' },
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Estoque
          </h1>
          <p className="text-[15px] text-slate-600">
            {produtos.length === 0
              ? 'Nenhum produto cadastrado ainda.'
              : `${produtos.length} ${produtos.length === 1 ? 'produto cadastrado' : 'produtos cadastrados'}.`}
          </p>
        </div>

        <Link
          href="/painel/produtos/novo"
          className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-[15px] font-semibold text-white transition hover:bg-emerald-700"
        >
          Novo produto
        </Link>
      </div>

      {produtos.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center">
          <p className="text-[15px] text-slate-600">
            Cadastre o primeiro item do seu estoque para começar.
          </p>
          <Link
            href="/painel/produtos/novo"
            className="font-semibold text-emerald-700 hover:underline"
          >
            Cadastrar produto
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-900/8 bg-white">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-900/8 text-[13px] font-semibold text-slate-500">
                <th className="px-5 py-4">Produto</th>
                <th className="px-5 py-4">SKU</th>
                <th className="px-5 py-4 text-right">Peso</th>
                <th className="px-5 py-4 text-right">Dimensões (A×L×C)</th>
                <th className="px-5 py-4 text-right">Volume</th>
                <th className="px-5 py-4 text-right">Qtd.</th>
                <th className="px-5 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-[14px]">
              {produtos.map((produto) => (
                <tr
                  key={produto.id}
                  className="border-b border-slate-900/5 last:border-0"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {produto.imagemUrl ? (
                          <Image
                            src={produto.imagemUrl}
                            alt=""
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-[11px] text-slate-400">
                            sem foto
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">
                          {produto.nome}
                        </span>
                        {produto.descricao && (
                          <span className="line-clamp-1 text-[13px] text-slate-500">
                            {produto.descricao}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {produto.sku || '—'}
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums text-slate-700">
                    {numero(produto.pesoKg, 3)} kg
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums text-slate-700">
                    {numero(produto.alturaCm, 1)} × {numero(produto.larguraCm, 1)}{' '}
                    × {numero(produto.comprimentoCm, 1)} cm
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums text-slate-700">
                    {numero(produto.volumeM3, 4)} m³
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums text-slate-700">
                    {produto.quantidade}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/painel/produtos/${produto.id}`}
                        className="font-semibold text-emerald-700 hover:underline"
                      >
                        Editar
                      </Link>
                      <form action={excluirProduto}>
                        <input type="hidden" name="id" value={produto.id} />
                        <button
                          type="submit"
                          className="font-semibold text-red-600 hover:underline"
                        >
                          Excluir
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
