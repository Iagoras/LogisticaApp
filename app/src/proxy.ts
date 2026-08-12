/**
 * Protege as rotas do painel.
 *
 * (No Next 16 esta convenção chama-se `proxy`; era `middleware` até a v15.)
 *
 * Usa `auth.config.ts` (sem Prisma) porque roda no Edge Runtime. A sessão
 * é lida do JWT no cookie, sem consultar o banco.
 *
 * Esta é a primeira barreira, não a única: cada Server Action revalida a
 * sessão, porque elas são alcançáveis por POST direto.
 */

import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';

import { authConfig } from '@/auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const logado = Boolean(req.auth?.user);
  const { pathname } = req.nextUrl;

  // `nextUrl.origin` usa AUTH_URL/NEXTAUTH_URL quando definido, o que manda
  // o usuário para a porta errada se o servidor subir em outra. O host da
  // requisição é a fonte confiável aqui.
  const base = new URL(req.url).origin;

  const rotaProtegida = pathname.startsWith('/painel');
  const rotaDeAuth = pathname === '/entrar' || pathname === '/cadastrar';

  if (rotaProtegida && !logado) {
    const url = new URL('/entrar', base);
    // Depois do login, volta para onde a pessoa queria ir.
    url.searchParams.set('proximo', pathname);
    return NextResponse.redirect(url);
  }

  if (rotaDeAuth && logado) {
    return NextResponse.redirect(new URL('/painel', base));
  }

  return NextResponse.next();
});

export const config = {
  // Ignora estáticos, imagens e a própria API de auth.
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|uploads).*)'],
};
