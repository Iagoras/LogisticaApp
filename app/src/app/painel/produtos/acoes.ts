'use server';

/**
 * Server Actions do CRUD de produtos.
 *
 * Regra de ouro: estas funções são alcançáveis por POST direto, sem passar
 * pela interface. Por isso toda ação (a) exige sessão e (b) confirma que o
 * produto pertence ao fornecedor logado antes de tocar em qualquer coisa.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { removerImagemProduto, salvarImagemProduto } from '@/lib/upload';
import { calcularVolumeM3, produtoSchema } from '@/lib/validacoes';

export type EstadoProduto = {
  erro?: string;
  camposComErro?: Record<string, string[]>;
};

function extrairErros(erro: z.ZodError): Record<string, string[]> {
  const campos: Record<string, string[]> = {};
  for (const problema of erro.issues) {
    const campo = String(problema.path[0] ?? 'form');
    (campos[campo] ??= []).push(problema.message);
  }
  return campos;
}

/**
 * Devolve o fornecedor da sessão atual.
 * Lança se não houver sessão — nenhuma ação abaixo roda sem isso.
 */
async function exigirFornecedor(): Promise<string> {
  const sessao = await auth();
  const fornecedorId = sessao?.user?.fornecedorId;

  if (!fornecedorId) {
    throw new Error('Não autorizado.');
  }

  return fornecedorId;
}

/** Confirma que o produto existe E pertence a quem está pedindo. */
async function exigirProdutoDoFornecedor(
  produtoId: string,
  fornecedorId: string,
) {
  const produto = await prisma.produto.findUnique({
    where: { id: produtoId },
    select: { id: true, fornecedorId: true, imagemUrl: true },
  });

  // Mesma resposta para "não existe" e "não é seu" — não revela a
  // existência de produtos de outros fornecedores.
  if (!produto || produto.fornecedorId !== fornecedorId) {
    throw new Error('Produto não encontrado.');
  }

  return produto;
}

/* -------------------------------------------------------------------------
   Criar
   ------------------------------------------------------------------------- */

export async function criarProduto(
  _anterior: EstadoProduto,
  formData: FormData,
): Promise<EstadoProduto> {
  const fornecedorId = await exigirFornecedor();

  const bruto = Object.fromEntries(formData);
  const analise = produtoSchema.safeParse(bruto);

  if (!analise.success) {
    return {
      erro: 'Confira os campos destacados.',
      camposComErro: extrairErros(analise.error),
    };
  }

  const dados = analise.data;

  // A imagem é opcional; só processa se veio arquivo com conteúdo.
  let imagemUrl: string | null = null;
  const arquivo = formData.get('imagem');

  if (arquivo instanceof File && arquivo.size > 0) {
    const upload = await salvarImagemProduto(arquivo);
    if (!upload.ok) {
      return { erro: upload.erro, camposComErro: { imagem: [upload.erro] } };
    }
    imagemUrl = upload.url;
  }

  try {
    await prisma.produto.create({
      data: {
        fornecedorId,
        nome: dados.nome,
        descricao: dados.descricao || null,
        sku: dados.sku || null,
        imagemUrl,
        pesoKg: dados.pesoKg,
        alturaCm: dados.alturaCm,
        larguraCm: dados.larguraCm,
        comprimentoCm: dados.comprimentoCm,
        volumeM3: calcularVolumeM3(
          dados.alturaCm,
          dados.larguraCm,
          dados.comprimentoCm,
        ),
        quantidade: dados.quantidade,
      },
    });
  } catch (erro) {
    // Se a gravação falhou, a imagem já salva vira lixo — remove.
    await removerImagemProduto(imagemUrl);

    if (
      typeof erro === 'object' &&
      erro !== null &&
      'code' in erro &&
      erro.code === 'P2002'
    ) {
      return {
        erro: 'Já existe um produto seu com este SKU.',
        camposComErro: { sku: ['SKU já usado.'] },
      };
    }

    console.error('Falha ao criar produto:', erro);
    return { erro: 'Não foi possível salvar o produto.' };
  }

  revalidatePath('/painel/produtos');
  redirect('/painel/produtos');
}

/* -------------------------------------------------------------------------
   Atualizar
   ------------------------------------------------------------------------- */

export async function atualizarProduto(
  _anterior: EstadoProduto,
  formData: FormData,
): Promise<EstadoProduto> {
  const fornecedorId = await exigirFornecedor();

  const produtoId = String(formData.get('id') || '');
  if (!produtoId) return { erro: 'Produto não informado.' };

  const atual = await exigirProdutoDoFornecedor(produtoId, fornecedorId);

  const analise = produtoSchema.safeParse(Object.fromEntries(formData));

  if (!analise.success) {
    return {
      erro: 'Confira os campos destacados.',
      camposComErro: extrairErros(analise.error),
    };
  }

  const dados = analise.data;

  // Troca de imagem: só substitui se veio arquivo novo.
  let imagemUrl = atual.imagemUrl;
  let imagemAntigaParaApagar: string | null = null;
  const arquivo = formData.get('imagem');

  if (arquivo instanceof File && arquivo.size > 0) {
    const upload = await salvarImagemProduto(arquivo);
    if (!upload.ok) {
      return { erro: upload.erro, camposComErro: { imagem: [upload.erro] } };
    }
    imagemAntigaParaApagar = atual.imagemUrl;
    imagemUrl = upload.url;
  } else if (formData.get('removerImagem') === 'sim') {
    imagemAntigaParaApagar = atual.imagemUrl;
    imagemUrl = null;
  }

  try {
    await prisma.produto.update({
      where: { id: produtoId },
      data: {
        nome: dados.nome,
        descricao: dados.descricao || null,
        sku: dados.sku || null,
        imagemUrl,
        pesoKg: dados.pesoKg,
        alturaCm: dados.alturaCm,
        larguraCm: dados.larguraCm,
        comprimentoCm: dados.comprimentoCm,
        volumeM3: calcularVolumeM3(
          dados.alturaCm,
          dados.larguraCm,
          dados.comprimentoCm,
        ),
        quantidade: dados.quantidade,
      },
    });
  } catch (erro) {
    if (
      typeof erro === 'object' &&
      erro !== null &&
      'code' in erro &&
      erro.code === 'P2002'
    ) {
      return {
        erro: 'Já existe um produto seu com este SKU.',
        camposComErro: { sku: ['SKU já usado.'] },
      };
    }

    console.error('Falha ao atualizar produto:', erro);
    return { erro: 'Não foi possível salvar as alterações.' };
  }

  // Só apaga a imagem antiga depois que o banco confirmou a troca.
  await removerImagemProduto(imagemAntigaParaApagar);

  revalidatePath('/painel/produtos');
  redirect('/painel/produtos');
}

/* -------------------------------------------------------------------------
   Excluir
   ------------------------------------------------------------------------- */

export async function excluirProduto(formData: FormData): Promise<void> {
  const fornecedorId = await exigirFornecedor();

  const produtoId = String(formData.get('id') || '');
  if (!produtoId) return;

  const produto = await exigirProdutoDoFornecedor(produtoId, fornecedorId);

  await prisma.produto.delete({ where: { id: produtoId } });
  await removerImagemProduto(produto.imagemUrl);

  revalidatePath('/painel/produtos');
}
