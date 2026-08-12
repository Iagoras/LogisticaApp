/**
 * Remove os dados criados pelos testes/diagnósticos.
 * Uso: node scripts/limpar-teste.mjs
 */
import 'dotenv/config';
import { Client } from 'pg';

const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();

const r = await c.query(`
  DELETE FROM usuarios
  WHERE email LIKE '%@teste.local'
     OR email LIKE '%@diagnostico.local'
     OR email LIKE '%@teste.com.br'
     OR email LIKE '%@exemplo.local'
`);
console.log('usuários de teste removidos:', r.rowCount);

const restantes = await c.query('SELECT COUNT(*)::int AS n FROM usuarios');
console.log('usuários restantes no banco:', restantes.rows[0].n);

await c.end();
