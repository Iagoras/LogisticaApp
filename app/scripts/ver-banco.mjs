/**
 * Inspeciona a estrutura criada no banco. Uso: node scripts/ver-banco.mjs
 */
import 'dotenv/config';
import { Client } from 'pg';

const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();

const t = await c.query(`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema='public' ORDER BY table_name
`);
console.log('TABELAS:');
t.rows.forEach((r) => console.log('  ' + r.table_name));

const p = await c.query(`
  SELECT column_name, data_type, numeric_precision, numeric_scale, is_nullable
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='produtos'
  ORDER BY ordinal_position
`);
console.log('\nCOLUNAS DE produtos:');
p.rows.forEach((r) => {
  const tipo = r.numeric_precision
    ? `${r.data_type}(${r.numeric_precision},${r.numeric_scale})`
    : r.data_type;
  console.log(`  ${r.column_name.padEnd(18)} ${tipo.padEnd(24)} null=${r.is_nullable}`);
});

const fk = await c.query(`
  SELECT tc.table_name, kcu.column_name, ccu.table_name AS referencia
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
  WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_schema='public'
  ORDER BY tc.table_name
`);
console.log('\nCHAVES ESTRANGEIRAS:');
fk.rows.forEach((r) => console.log(`  ${r.table_name}.${r.column_name} -> ${r.referencia}`));

await c.end();
