import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { atualizarProduto } from '../acoes';
import { FormularioProduto } from '../formulario';

export const metadata = { title: 'Editar produto · TCA Move' };

/** Decimal do Prisma para string editável, sem notação científica. */
const texto = (valor: unknown) => String(valor);

export default async function PaginaEditarProduto({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const sessao = await auth();
  const fornecedorId = sessao?.user?.fornecedorId;
  if (!fornecedorId) redirect('/entrar');

  const produto = await prisma.produto.findUnique({ where: { id } });

  // Produto de outro fornecedor devolve 404 — não confirma que existe.
  if (!produto || produto.fornecedorId !== fornecedorId) notFound();

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
          Editar produto
        </h1>
      </div>

      <FormularioProduto
        acao={atualizarProduto}
        rotuloEnvio="Salvar alterações"
        valores={{
          id: produto.id,
          nome: produto.nome,
          descricao: produto.descricao ?? '',
          sku: produto.sku ?? '',
          imagemUrl: produto.imagemUrl,
          pesoKg: texto(produto.pesoKg),
          alturaCm: texto(produto.alturaCm),
          larguraCm: texto(produto.larguraCm),
          comprimentoCm: texto(produto.comprimentoCm),
          quantidade: String(produto.quantidade),
        }}
      />
    </div>
  );
}
