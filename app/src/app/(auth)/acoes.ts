'use server';

/**
 * Server Actions de autenticação.
 *
 * Toda validação acontece aqui: estas funções são alcançáveis por POST
 * direto, sem passar pelo formulário.
 */

import bcrypt from 'bcryptjs';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { signIn } from '@/auth';
import { prisma } from '@/lib/prisma';
import { cadastroSchema, loginSchema } from '@/lib/validacoes';

/** Formato devolvido para o `useActionState` dos formulários. */
export type EstadoFormulario = {
  erro?: string;
  camposComErro?: Record<string, string[]>;
};

/** Custo do bcrypt. 12 é o equilíbrio atual entre segurança e latência. */
const CUSTO_BCRYPT = 12;

/** Converte os erros do Zod no formato campo -> mensagens. */
function extrairErros(erro: z.ZodError): Record<string, string[]> {
  const campos: Record<string, string[]> = {};

  for (const problema of erro.issues) {
    const campo = String(problema.path[0] ?? 'form');
    (campos[campo] ??= []).push(problema.message);
  }

  return campos;
}

/* -------------------------------------------------------------------------
   Cadastro
   ------------------------------------------------------------------------- */

export async function cadastrarFornecedor(
  _anterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const analise = cadastroSchema.safeParse(Object.fromEntries(formData));

  if (!analise.success) {
    return {
      erro: 'Confira os campos destacados.',
      camposComErro: extrairErros(analise.error),
    };
  }

  const dados = analise.data;
  const email = dados.email.toLowerCase().trim();

  // Checagem amigável antes de tentar gravar. A garantia real são os
  // índices únicos — a corrida entre duas requisições cai no catch abaixo.
  const [emailEmUso, cnpjEmUso] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    prisma.fornecedor.findUnique({
      where: { cnpj: dados.cnpj },
      select: { id: true },
    }),
  ]);

  if (emailEmUso) {
    return { erro: 'Já existe uma conta com este e-mail.', camposComErro: { email: ['E-mail já cadastrado.'] } };
  }

  if (cnpjEmUso) {
    return { erro: 'Este CNPJ já está cadastrado.', camposComErro: { cnpj: ['CNPJ já cadastrado.'] } };
  }

  const senhaHash = await bcrypt.hash(dados.senha, CUSTO_BCRYPT);

  try {
    // Uma transação: ou nasce usuário + fornecedor + endereço, ou nada.
    await prisma.user.create({
      data: {
        nome: dados.nome,
        email,
        senhaHash,
        papel: 'FORNECEDOR',
        fornecedor: {
          create: {
            razaoSocial: dados.razaoSocial,
            nomeFantasia: dados.nomeFantasia || null,
            cnpj: dados.cnpj,
            telefone: dados.telefone || null,
            endereco: {
              create: {
                cep: dados.cep,
                logradouro: dados.logradouro,
                numero: dados.numero,
                complemento: dados.complemento || null,
                bairro: dados.bairro,
                cidade: dados.cidade,
                estado: dados.estado,
              },
            },
          },
        },
      },
    });
  } catch (erro) {
    // P2002 = violação de índice único (corrida entre requisições).
    if (
      typeof erro === 'object' &&
      erro !== null &&
      'code' in erro &&
      erro.code === 'P2002'
    ) {
      return { erro: 'E-mail ou CNPJ já cadastrado.' };
    }

    console.error('Falha ao cadastrar fornecedor:', erro);
    return { erro: 'Não foi possível concluir o cadastro. Tente novamente.' };
  }

  // Loga automaticamente após o cadastro.
  await signIn('credentials', {
    email,
    senha: dados.senha,
    redirectTo: '/painel',
  });

  return {};
}

/* -------------------------------------------------------------------------
   Login
   ------------------------------------------------------------------------- */

export async function entrar(
  _anterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const analise = loginSchema.safeParse(Object.fromEntries(formData));

  if (!analise.success) {
    return {
      erro: 'Confira os campos destacados.',
      camposComErro: extrairErros(analise.error),
    };
  }

  const proximo = String(formData.get('proximo') || '/painel');
  // Só aceita caminho interno — bloqueia redirecionamento para outro site.
  const destino = proximo.startsWith('/') && !proximo.startsWith('//')
    ? proximo
    : '/painel';

  try {
    await signIn('credentials', {
      email: analise.data.email.toLowerCase(),
      senha: analise.data.senha,
      redirectTo: destino,
    });
  } catch (erro) {
    if (erro instanceof AuthError) {
      return { erro: 'E-mail ou senha incorretos.' };
    }
    // `signIn` sinaliza o redirect lançando — precisa subir.
    throw erro;
  }

  return {};
}

/* -------------------------------------------------------------------------
   Logout
   ------------------------------------------------------------------------- */

export async function sair() {
  const { signOut } = await import('@/auth');
  await signOut({ redirectTo: '/' });
  redirect('/');
}
