import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { formatarCnpj } from '@/lib/cnpj';

export const metadata = { title: 'Painel · TCA Move' };

function Cartao({
  rotulo,
  valor,
  sufixo,
}: {
  rotulo: string;
  valor: string;
  sufixo?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-slate-900/8 bg-white p-6">
      <span className="text-[13px] font-semibold text-slate-500">{rotulo}</span>
      <span className="text-3xl font-bold tracking-tight text-emerald-700">
        {valor}
        {sufixo && (
          <span className="ml-1 text-base font-semibold text-slate-500">
            {sufixo}
          </span>
        )}
      </span>
    </div>
  );
}

export default async function PaginaPainel() {
  const sessao = await auth();
  const fornecedorId = sessao?.user?.fornecedorId;

  if (!fornecedorId) redirect('/entrar');

  const [fornecedor, agregados, totalItens] = await Promise.all([
    prisma.fornecedor.findUnique({
      where: { id: fornecedorId },
      include: { endereco: true },
    }),
    prisma.produto.aggregate({
      where: { fornecedorId },
      _count: { _all: true },
      _sum: { volumeM3: true },
    }),
    prisma.produto.aggregate({
      where: { fornecedorId },
      _sum: { quantidade: true },
    }),
  ]);

  if (!fornecedor) redirect('/entrar');

  const formatarNumero = (valor: number, casas = 0) =>
    valor.toLocaleString('pt-BR', {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
    });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Olá, {sessao.user.name?.split(' ')[0]}
        </h1>
        <p className="text-[15px] text-slate-600">
          Resumo do estoque de {fornecedor.nomeFantasia || fornecedor.razaoSocial}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Cartao
          rotulo="Produtos cadastrados"
          valor={formatarNumero(agregados._count._all)}
        />
        <Cartao
          rotulo="Itens em estoque"
          valor={formatarNumero(totalItens._sum.quantidade ?? 0)}
        />
        <Cartao
          rotulo="Volume total"
          valor={formatarNumero(Number(agregados._sum.volumeM3 ?? 0), 3)}
          sufixo="m³"
        />
      </div>

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-900/8 bg-white p-6 md:p-8">
        <h2 className="text-lg font-bold tracking-tight text-slate-900">
          Dados da empresa
        </h2>
        <dl className="grid gap-x-8 gap-y-4 text-[15px] sm:grid-cols-2">
          <div>
            <dt className="text-[13px] font-semibold text-slate-500">
              Razão social
            </dt>
            <dd className="text-slate-900">{fornecedor.razaoSocial}</dd>
          </div>
          <div>
            <dt className="text-[13px] font-semibold text-slate-500">CNPJ</dt>
            <dd className="text-slate-900">{formatarCnpj(fornecedor.cnpj)}</dd>
          </div>
          {fornecedor.endereco && (
            <div className="sm:col-span-2">
              <dt className="text-[13px] font-semibold text-slate-500">
                Endereço
              </dt>
              <dd className="text-slate-900">
                {fornecedor.endereco.logradouro}, {fornecedor.endereco.numero}
                {fornecedor.endereco.complemento &&
                  ` — ${fornecedor.endereco.complemento}`}
                {' · '}
                {fornecedor.endereco.bairro}, {fornecedor.endereco.cidade}/
                {fornecedor.endereco.estado}
              </dd>
            </div>
          )}
        </dl>
      </section>

      <Link
        href="/painel/produtos"
        className="inline-flex w-fit items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-emerald-700"
      >
        Gerenciar estoque
      </Link>
    </div>
  );
}
