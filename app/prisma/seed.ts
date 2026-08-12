/**
 * Popula o banco com dados de demonstração.
 *
 * Uso: npm run db:seed
 *
 * É idempotente: rodar de novo atualiza o fornecedor existente em vez de
 * duplicar. NÃO roda em produção — a checagem abaixo aborta.
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';

if (process.env.NODE_ENV === 'production') {
  console.error('O seed não roda em produção. Abortando.');
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

/** Volume em m³ a partir das dimensões em cm. */
const volume = (a: number, l: number, c: number) =>
  Number(((a * l * c) / 1_000_000).toFixed(6));

const PRODUTOS = [
  {
    nome: 'Caixa de papelão reforçada',
    descricao: 'Papelão ondulado duplo, suporta 30 kg.',
    sku: 'CX-001',
    pesoKg: 0.85,
    alturaCm: 30,
    larguraCm: 40,
    comprimentoCm: 50,
    quantidade: 480,
  },
  {
    nome: 'Palete PBR madeira',
    descricao: 'Padrão PBR 1,00 × 1,20 m, madeira tratada.',
    sku: 'PL-PBR',
    pesoKg: 25,
    alturaCm: 14,
    larguraCm: 100,
    comprimentoCm: 120,
    quantidade: 120,
  },
  {
    nome: 'Filme stretch 500 mm',
    descricao: 'Bobina de 5 kg para paletização.',
    sku: 'FS-500',
    pesoKg: 5.2,
    alturaCm: 50,
    larguraCm: 25,
    comprimentoCm: 25,
    quantidade: 96,
  },
  {
    nome: 'Contentor plástico dobrável',
    descricao: 'Empilhável, 240 L.',
    sku: 'CT-240',
    pesoKg: 12.4,
    alturaCm: 78,
    larguraCm: 60,
    comprimentoCm: 80,
    quantidade: 45,
  },
];

async function main() {
  const email = 'demo@tcamove.local';
  const senha = 'Demo1234';

  const senhaHash = await bcrypt.hash(senha, 12);

  const DADOS_FORNECEDOR = {
    razaoSocial: 'Demo Transportes e Logística Ltda',
    nomeFantasia: 'Demo Log',
    // CNPJ fictício com dígitos verificadores válidos.
    cnpj: '11444777000161',
    telefone: '11988887777',
  };

  const DADOS_ENDERECO = {
    cep: '01310100',
    logradouro: 'Av. Paulista',
    numero: '1000',
    complemento: 'Conj. 51',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
  };

  // upsert pelo e-mail: rodar duas vezes não duplica.
  const usuario = await prisma.user.upsert({
    where: { email },
    update: { senhaHash },
    create: {
      nome: 'Fornecedor Demonstração',
      email,
      senhaHash,
      papel: 'FORNECEDOR',
    },
  });

  // O fornecedor é tratado à parte: se o usuário já existia sem fornecedor
  // (ex.: banco limpo pela metade), o ramo `update` acima não o criaria.
  const fornecedor = await prisma.fornecedor.upsert({
    where: { usuarioId: usuario.id },
    update: DADOS_FORNECEDOR,
    create: {
      ...DADOS_FORNECEDOR,
      usuarioId: usuario.id,
      endereco: { create: DADOS_ENDERECO },
    },
  });

  await prisma.endereco.upsert({
    where: { fornecedorId: fornecedor.id },
    update: DADOS_ENDERECO,
    create: { ...DADOS_ENDERECO, fornecedorId: fornecedor.id },
  });

  const fornecedorId = fornecedor.id;

  for (const p of PRODUTOS) {
    await prisma.produto.upsert({
      where: { fornecedorId_sku: { fornecedorId, sku: p.sku } },
      update: {},
      create: {
        ...p,
        fornecedorId,
        volumeM3: volume(p.alturaCm, p.larguraCm, p.comprimentoCm),
      },
    });
  }

  const total = await prisma.produto.count({ where: { fornecedorId } });

  console.log('Seed concluído.');
  console.log(`  Fornecedor: ${usuario.email}`);
  console.log(`  Senha:      ${senha}`);
  console.log(`  Produtos:   ${total}`);
}

main()
  .catch((erro) => {
    console.error('Falha no seed:', erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
