/**
 * Schemas de validação (Zod).
 *
 * Usados tanto nas Server Actions quanto nos formulários. Como as Server
 * Actions são acessíveis por POST direto, a validação aqui é a que vale —
 * a do navegador é só conveniência.
 */

import { z } from 'zod';
import { apenasDigitos, validarCnpj } from './cnpj';

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

/* -------------------------------------------------------------------------
   Autenticação
   ------------------------------------------------------------------------- */

export const loginSchema = z.object({
  email: z.email('E-mail inválido.'),
  senha: z.string().min(1, 'Informe a senha.'),
});

export const cadastroSchema = z
  .object({
    nome: z
      .string()
      .trim()
      .min(3, 'Informe seu nome completo.')
      .max(120, 'Nome muito longo.'),
    email: z.email('E-mail inválido.').max(160, 'E-mail muito longo.'),
    senha: z
      .string()
      .min(8, 'A senha precisa ter ao menos 8 caracteres.')
      .max(72, 'A senha pode ter no máximo 72 caracteres.')
      .regex(/[a-zA-Z]/, 'A senha precisa ter ao menos uma letra.')
      .regex(/\d/, 'A senha precisa ter ao menos um número.'),
    confirmarSenha: z.string(),

    // Dados da empresa
    razaoSocial: z
      .string()
      .trim()
      .min(3, 'Informe a razão social.')
      .max(160, 'Razão social muito longa.'),
    nomeFantasia: z.string().trim().max(160).optional().or(z.literal('')),
    cnpj: z
      .string()
      .transform(apenasDigitos)
      .refine((v) => v.length === 14, 'O CNPJ precisa ter 14 dígitos.')
      .refine(validarCnpj, 'CNPJ inválido — confira os dígitos.'),
    telefone: z
      .string()
      .transform(apenasDigitos)
      .refine((v) => v === '' || (v.length >= 10 && v.length <= 11),
        'Telefone deve ter DDD + número.')
      .optional()
      .or(z.literal('')),

    // Endereço
    cep: z
      .string()
      .transform(apenasDigitos)
      .refine((v) => v.length === 8, 'O CEP precisa ter 8 dígitos.'),
    logradouro: z.string().trim().min(3, 'Informe o logradouro.').max(160),
    numero: z.string().trim().min(1, 'Informe o número.').max(20),
    complemento: z.string().trim().max(80).optional().or(z.literal('')),
    bairro: z.string().trim().min(2, 'Informe o bairro.').max(80),
    cidade: z.string().trim().min(2, 'Informe a cidade.').max(80),
    estado: z.enum(UFS, 'Selecione um estado válido.'),
  })
  .refine((dados) => dados.senha === dados.confirmarSenha, {
    message: 'As senhas não conferem.',
    path: ['confirmarSenha'],
  });

export type DadosCadastro = z.infer<typeof cadastroSchema>;

/* -------------------------------------------------------------------------
   Produtos
   ------------------------------------------------------------------------- */

/**
 * Converte "12,5" ou "12.5" em número — o usuário digita com vírgula.
 *
 * O parse é feito no próprio transform (em vez de `.pipe(z.coerce...)`)
 * porque o coerce do Zod 4 aceita `unknown` na entrada e quebra a cadeia
 * de tipos vinda de `z.string()`.
 */
const numeroBr = (mensagem: string) =>
  z
    .string()
    .trim()
    .min(1, mensagem)
    .transform((v, ctx) => {
      const numero = Number(v.replace(',', '.'));

      if (!Number.isFinite(numero) || numero <= 0) {
        ctx.addIssue({ code: 'custom', message: mensagem });
        return z.NEVER;
      }

      return numero;
    });

export const produtoSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, 'Informe o nome do produto.')
    .max(160, 'Nome muito longo.'),
  descricao: z.string().trim().max(1000).optional().or(z.literal('')),
  sku: z.string().trim().max(60).optional().or(z.literal('')),

  pesoKg: numeroBr('Peso deve ser maior que zero.'),
  alturaCm: numeroBr('Altura deve ser maior que zero.'),
  larguraCm: numeroBr('Largura deve ser maior que zero.'),
  comprimentoCm: numeroBr('Comprimento deve ser maior que zero.'),

  quantidade: z
    .string()
    .trim()
    .default('0')
    .transform((v, ctx) => {
      const numero = Number(v === '' ? '0' : v);

      if (!Number.isInteger(numero) || numero < 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'Quantidade deve ser um número inteiro não negativo.',
        });
        return z.NEVER;
      }

      return numero;
    }),
});

export type DadosProduto = z.infer<typeof produtoSchema>;

/**
 * Volume em m³ a partir das dimensões em centímetros.
 * 1 m³ = 1.000.000 cm³.
 */
export function calcularVolumeM3(
  alturaCm: number,
  larguraCm: number,
  comprimentoCm: number,
): number {
  const cm3 = alturaCm * larguraCm * comprimentoCm;
  // Seis casas decimais é o que a coluna Decimal(12,6) comporta.
  return Number((cm3 / 1_000_000).toFixed(6));
}

/* -------------------------------------------------------------------------
   Upload de imagem
   ------------------------------------------------------------------------- */

export const TAMANHO_MAX_IMAGEM = 5 * 1024 * 1024; // 5 MB

export const TIPOS_IMAGEM_ACEITOS = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const imagemSchema = z
  .instanceof(File)
  .refine((f) => f.size > 0, 'Arquivo vazio.')
  .refine(
    (f) => f.size <= TAMANHO_MAX_IMAGEM,
    'A imagem deve ter no máximo 5 MB.',
  )
  .refine(
    (f) => (TIPOS_IMAGEM_ACEITOS as readonly string[]).includes(f.type),
    'Formato inválido. Use JPEG, PNG ou WebP.',
  );
