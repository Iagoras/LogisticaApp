/**
 * Instância única do Prisma Client.
 *
 * Prisma 7 não tem mais o engine em Rust: a conexão passa por um driver
 * adapter (`@prisma/adapter-pg`), que recebe a URL diretamente.
 *
 * Em desenvolvimento o Next recarrega os módulos a cada alteração; sem o
 * cache no `globalThis` cada reload abriria um novo pool de conexões até
 * o Postgres recusar novas conexões.
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

const globalParaPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function criarClient(): PrismaClient {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      'DATABASE_URL não definida. Copie .env.example para .env e preencha.',
    );
  }

  const adapter = new PrismaPg({ connectionString: url });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export const prisma = globalParaPrisma.prisma ?? criarClient();

if (process.env.NODE_ENV !== 'production') {
  globalParaPrisma.prisma = prisma;
}
