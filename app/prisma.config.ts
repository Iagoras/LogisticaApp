/**
 * Configuração do Prisma CLI (Prisma 7).
 *
 * A partir da v7 a URL de conexão sai do schema.prisma e vem para cá.
 * As variáveis do .env precisam ser carregadas explicitamente.
 */

import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
