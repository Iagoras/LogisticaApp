/**
 * Configuração completa do NextAuth (Auth.js v5).
 *
 * Estende `auth.config.ts` acrescentando o provider Credentials, que
 * consulta o banco. Este arquivo NÃO pode ser importado pelo middleware
 * (Edge Runtime) — veja o comentário em auth.config.ts.
 *
 * Estratégia JWT em vez de sessão no banco: o provider Credentials não
 * cria registro em `sessoes`, e o JWT evita uma consulta a cada request.
 * As tabelas do adapter ficam prontas para um provedor OAuth futuro.
 */

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

import { authConfig } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validacoes';

/**
 * Hash descartável usado para gastar o mesmo tempo de CPU quando o e-mail
 * não existe. Sem isso, a diferença de tempo de resposta revela quais
 * e-mails estão cadastrados.
 */
const HASH_FALSO = '$2b$12$C6UzMDM.H6dfI/f/IKcEeO1oM4b1Q0mV0lF0Cg5S1kCkVzD/9Aq8y';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,

  providers: [
    Credentials({
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        senha: { label: 'Senha', type: 'password' },
      },

      authorize: async (credentials) => {
        const analise = loginSchema.safeParse(credentials);
        if (!analise.success) return null;

        const { email, senha } = analise.data;

        const usuario = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: { fornecedor: { select: { id: true } } },
        });

        // Conta sem senha veio de um provedor OAuth — não entra por aqui.
        if (!usuario?.senhaHash) {
          await bcrypt.compare(senha, HASH_FALSO);
          return null;
        }

        const confere = await bcrypt.compare(senha, usuario.senhaHash);
        if (!confere) return null;

        return {
          id: usuario.id,
          name: usuario.nome,
          email: usuario.email,
          papel: usuario.papel,
          fornecedorId: usuario.fornecedor?.id ?? null,
        };
      },
    }),
  ],
});
