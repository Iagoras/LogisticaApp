/**
 * Extensão dos tipos do Auth.js para os campos próprios da aplicação.
 *
 * O `import ... from 'next-auth'` (valor, não só tipo) é necessário para
 * o arquivo ser tratado como módulo — sem ele o `declare module` vira
 * declaração global e a augmentação não pega.
 */

import type { Papel } from '@/generated/prisma/client';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    papel: Papel;
    /** Nulo enquanto o usuário não tiver um fornecedor vinculado. */
    fornecedorId: string | null;
  }

  interface Session {
    user: {
      id: string;
      papel: Papel;
      fornecedorId: string | null;
    } & DefaultSession['user'];
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    papel: Papel;
    fornecedorId: string | null;
  }
}

export {};
