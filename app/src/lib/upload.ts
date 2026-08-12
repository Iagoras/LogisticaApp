import 'server-only';

/**
 * Gravação de imagens de produto.
 *
 * Guarda em `public/uploads/produtos`, que é o suficiente para
 * desenvolvimento e um servidor único. Em produção com múltiplas
 * instâncias (ou no Vercel, cujo disco é efêmero), troque por S3 /
 * Cloudflare R2 — só o corpo destas funções muda.
 */

import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { imagemSchema } from './validacoes';

const PASTA_PUBLICA = path.join(process.cwd(), 'public', 'uploads', 'produtos');
const PREFIXO_URL = '/uploads/produtos';

/** Extensão a partir do MIME — não confiamos no nome enviado pelo cliente. */
const EXTENSAO_POR_TIPO: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export type ResultadoUpload =
  | { ok: true; url: string }
  | { ok: false; erro: string };

/**
 * Valida e grava a imagem. Devolve a URL pública.
 *
 * O nome do arquivo é sempre gerado aqui (UUID + extensão derivada do
 * MIME), então nome malicioso vindo do cliente não vira path traversal.
 */
export async function salvarImagemProduto(
  arquivo: File,
): Promise<ResultadoUpload> {
  const analise = imagemSchema.safeParse(arquivo);

  if (!analise.success) {
    return { ok: false, erro: analise.error.issues[0].message };
  }

  const extensao = EXTENSAO_POR_TIPO[arquivo.type];
  if (!extensao) {
    return { ok: false, erro: 'Formato de imagem não suportado.' };
  }

  try {
    await mkdir(PASTA_PUBLICA, { recursive: true });

    const nome = `${randomUUID()}.${extensao}`;
    const bytes = Buffer.from(await arquivo.arrayBuffer());

    await writeFile(path.join(PASTA_PUBLICA, nome), bytes);

    return { ok: true, url: `${PREFIXO_URL}/${nome}` };
  } catch (erro) {
    console.error('Falha ao gravar imagem:', erro);
    return { ok: false, erro: 'Não foi possível salvar a imagem.' };
  }
}

/**
 * Remove uma imagem gravada. Silencioso quando o arquivo já não existe —
 * apagar o produto não deve falhar por causa disso.
 */
export async function removerImagemProduto(url: string | null): Promise<void> {
  if (!url?.startsWith(`${PREFIXO_URL}/`)) return;

  const nome = path.basename(url);
  // Confere que sobrou só o nome do arquivo, sem separadores de caminho.
  if (nome !== url.slice(PREFIXO_URL.length + 1)) return;

  try {
    await unlink(path.join(PASTA_PUBLICA, nome));
  } catch (erro) {
    const codigo = (erro as NodeJS.ErrnoException).code;
    if (codigo !== 'ENOENT') {
      console.error('Falha ao remover imagem:', erro);
    }
  }
}
