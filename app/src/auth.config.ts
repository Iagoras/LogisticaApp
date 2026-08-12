/**
 * Configuração "leve" do NextAuth — sem Prisma, sem bcrypt.
 *
 * O middleware roda no Edge Runtime, que não tem `node:fs`/`node:path`.
 * Como o Prisma depende dessas APIs, ele não pode ser importado lá.
 * Este arquivo tem só o que o middleware precisa (callbacks de sessão e
 * as páginas); o provider Credentials, que consulta o banco, fica no
 * `auth.ts` completo usado pelo servidor.
 */

import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  session: { strategy: 'jwt' },

  pages: {
    signIn: '/entrar',
    error: '/entrar',
  },

  // Preenchido em auth.ts — aqui fica vazio de propósito.
  providers: [],

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.papel = user.papel;
        token.fornecedorId = user.fornecedorId;
      }
      return token;
    },

    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
        session.user.papel = token.papel;
        session.user.fornecedorId = token.fornecedorId;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
