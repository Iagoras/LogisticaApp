'use client';

import { useActionState } from 'react';
import Link from 'next/link';

import { entrar, type EstadoFormulario } from '../acoes';
import { Campo } from '@/components/campo';
import { BotaoEnviar } from '@/components/botao-enviar';

const ESTADO_INICIAL: EstadoFormulario = {};

export function FormularioLogin({ proximo }: { proximo?: string }) {
  const [estado, acao] = useActionState(entrar, ESTADO_INICIAL);

  return (
    <form action={acao} className="flex flex-col gap-5" noValidate>
      {proximo && <input type="hidden" name="proximo" value={proximo} />}

      {estado.erro && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700"
        >
          {estado.erro}
        </p>
      )}

      {/* Mantém o e-mail digitado quando a senha estava errada. */}
      <Campo
        rotulo="E-mail"
        nome="email"
        type="email"
        autoComplete="email"
        placeholder="voce@empresa.com.br"
        required
        defaultValue={estado.valores?.email ?? ''}
        erros={estado.camposComErro?.email}
      />

      <Campo
        rotulo="Senha"
        nome="senha"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        required
        erros={estado.camposComErro?.senha}
      />

      <BotaoEnviar carregando="Entrando…">Entrar</BotaoEnviar>

      <p className="text-center text-[14px] text-slate-600">
        Ainda não tem conta?{' '}
        <Link
          href="/cadastrar"
          className="font-semibold text-emerald-700 hover:underline"
        >
          Cadastre sua empresa
        </Link>
      </p>
    </form>
  );
}
