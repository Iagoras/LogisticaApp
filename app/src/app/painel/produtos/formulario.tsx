'use client';

import { useActionState, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { Campo, CampoTextarea } from '@/components/campo';
import { BotaoEnviar } from '@/components/botao-enviar';
import { calcularVolumeM3 } from '@/lib/validacoes';
import type { EstadoProduto } from './acoes';

const ESTADO_INICIAL: EstadoProduto = {};

/** Valores iniciais ao editar. Strings porque vêm de um <input>. */
export type ValoresProduto = {
  id: string;
  nome: string;
  descricao: string;
  sku: string;
  imagemUrl: string | null;
  pesoKg: string;
  alturaCm: string;
  larguraCm: string;
  comprimentoCm: string;
  quantidade: string;
};

type Props = {
  acao: (
    anterior: EstadoProduto,
    formData: FormData,
  ) => Promise<EstadoProduto>;
  valores?: ValoresProduto;
  rotuloEnvio: string;
};

/** Lê "12,5" como 12.5 para a prévia do volume. */
function paraNumero(valor: string): number {
  const n = Number(valor.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function FormularioProduto({ acao, valores, rotuloEnvio }: Props) {
  const [estado, enviar] = useActionState(acao, ESTADO_INICIAL);
  const erros = estado.camposComErro;

  // Prévia do volume enquanto a pessoa digita as dimensões.
  const [dimensoes, setDimensoes] = useState({
    altura: valores?.alturaCm ?? '',
    largura: valores?.larguraCm ?? '',
    comprimento: valores?.comprimentoCm ?? '',
  });

  const [removerImagem, setRemoverImagem] = useState(false);

  const volume = calcularVolumeM3(
    paraNumero(dimensoes.altura),
    paraNumero(dimensoes.largura),
    paraNumero(dimensoes.comprimento),
  );

  return (
    <form action={enviar} className="flex flex-col gap-6" noValidate>
      {valores && <input type="hidden" name="id" value={valores.id} />}
      {removerImagem && (
        <input type="hidden" name="removerImagem" value="sim" />
      )}

      {estado.erro && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700"
        >
          {estado.erro}
        </p>
      )}

      <section className="flex flex-col gap-5 rounded-2xl border border-slate-900/8 bg-white p-6 md:p-8">
        <h2 className="text-lg font-bold tracking-tight text-slate-900">
          Identificação
        </h2>

        <Campo
          rotulo="Nome do produto"
          nome="nome"
          placeholder="Caixa de papelão reforçada"
          required
          defaultValue={valores?.nome}
          erros={erros?.nome}
        />

        <CampoTextarea
          rotulo="Descrição"
          nome="descricao"
          placeholder="Detalhes que ajudem a identificar o item."
          defaultValue={valores?.descricao}
          erros={erros?.descricao}
        />

        <div className="grid gap-5 md:grid-cols-2">
          <Campo
            rotulo="SKU"
            nome="sku"
            placeholder="CX-001"
            dica="Código interno. Precisa ser único no seu estoque."
            defaultValue={valores?.sku}
            erros={erros?.sku}
          />
          <Campo
            rotulo="Quantidade em estoque"
            nome="quantidade"
            inputMode="numeric"
            placeholder="0"
            defaultValue={valores?.quantidade ?? '0'}
            erros={erros?.quantidade}
          />
        </div>
      </section>

      <section className="flex flex-col gap-5 rounded-2xl border border-slate-900/8 bg-white p-6 md:p-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Medidas
          </h2>
          <p className="text-[14px] text-slate-600">
            Peso em quilos e dimensões em centímetros. Aceita vírgula.
          </p>
        </div>

        <Campo
          rotulo="Peso (kg)"
          nome="pesoKg"
          inputMode="decimal"
          placeholder="1,5"
          required
          defaultValue={valores?.pesoKg}
          erros={erros?.pesoKg}
        />

        <div className="grid gap-5 md:grid-cols-3">
          <Campo
            rotulo="Altura (cm)"
            nome="alturaCm"
            inputMode="decimal"
            placeholder="30"
            required
            defaultValue={valores?.alturaCm}
            erros={erros?.alturaCm}
            onChange={(e) =>
              setDimensoes((d) => ({ ...d, altura: e.target.value }))
            }
          />
          <Campo
            rotulo="Largura (cm)"
            nome="larguraCm"
            inputMode="decimal"
            placeholder="40"
            required
            defaultValue={valores?.larguraCm}
            erros={erros?.larguraCm}
            onChange={(e) =>
              setDimensoes((d) => ({ ...d, largura: e.target.value }))
            }
          />
          <Campo
            rotulo="Comprimento (cm)"
            nome="comprimentoCm"
            inputMode="decimal"
            placeholder="50"
            required
            defaultValue={valores?.comprimentoCm}
            erros={erros?.comprimentoCm}
            onChange={(e) =>
              setDimensoes((d) => ({ ...d, comprimento: e.target.value }))
            }
          />
        </div>

        <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
          <span className="text-[14px] font-semibold text-emerald-900">
            Volume calculado
          </span>
          <span className="text-[15px] font-bold tabular-nums text-emerald-700">
            {volume.toLocaleString('pt-BR', {
              minimumFractionDigits: 4,
              maximumFractionDigits: 4,
            })}{' '}
            m³
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-5 rounded-2xl border border-slate-900/8 bg-white p-6 md:p-8">
        <h2 className="text-lg font-bold tracking-tight text-slate-900">
          Imagem
        </h2>

        {valores?.imagemUrl && !removerImagem && (
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-slate-100">
              <Image
                src={valores.imagemUrl}
                alt="Imagem atual do produto"
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => setRemoverImagem(true)}
              className="text-[14px] font-semibold text-red-600 hover:underline"
            >
              Remover imagem
            </button>
          </div>
        )}

        {removerImagem && (
          <p className="text-[14px] text-slate-600">
            A imagem será removida ao salvar.{' '}
            <button
              type="button"
              onClick={() => setRemoverImagem(false)}
              className="font-semibold text-emerald-700 hover:underline"
            >
              Desfazer
            </button>
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="imagem"
            className="text-[13px] font-semibold text-slate-700"
          >
            {valores?.imagemUrl ? 'Trocar imagem' : 'Enviar imagem'}
          </label>
          <input
            id="imagem"
            name="imagem"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-[14px] file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
          />
          <p className="text-[12px] text-slate-500">
            JPEG, PNG ou WebP, até 5 MB.
          </p>
          {erros?.imagem?.[0] && (
            <p className="text-[13px] text-red-600">{erros.imagem[0]}</p>
          )}
        </div>
      </section>

      <div className="flex items-center gap-4">
        <BotaoEnviar carregando="Salvando…">{rotuloEnvio}</BotaoEnviar>
        <Link
          href="/painel/produtos"
          className="text-[15px] font-medium text-slate-600 hover:text-slate-900"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
