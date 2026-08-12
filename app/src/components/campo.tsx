'use client';

/**
 * Campos de formulário com rótulo, erro e estilo consistentes.
 */

import { useEffect, useRef, useState } from 'react';
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

type Base = {
  rotulo: string;
  nome: string;
  erros?: string[];
  dica?: string;
};

const classeBase =
  'w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60';

function classes(temErro: boolean) {
  return `${classeBase} ${temErro ? 'border-red-400' : 'border-slate-200'}`;
}

function Erro({ nome, erros }: { nome: string; erros?: string[] }) {
  if (!erros?.length) return null;
  return (
    <p id={`${nome}-erro`} className="text-[13px] text-red-600">
      {erros[0]}
    </p>
  );
}

export function Campo({
  rotulo,
  nome,
  erros,
  dica,
  ...props
}: Base & InputHTMLAttributes<HTMLInputElement>) {
  const temErro = Boolean(erros?.length);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={nome} className="text-[13px] font-semibold text-slate-700">
        {rotulo}
        {props.required && <span className="text-emerald-600"> *</span>}
      </label>
      <input
        id={nome}
        name={nome}
        className={classes(temErro)}
        aria-invalid={temErro}
        aria-describedby={temErro ? `${nome}-erro` : undefined}
        {...props}
      />
      {dica && !temErro && <p className="text-[12px] text-slate-500">{dica}</p>}
      <Erro nome={nome} erros={erros} />
    </div>
  );
}

/**
 * Select controlado.
 *
 * Duas armadilhas resolvidas aqui:
 *
 * 1. `defaultValue` não repõe a seleção quando o React re-renderiza depois
 *    de uma Server Action — o DOM guarda a seleção antiga. Por isso o valor
 *    vive em estado local, sincronizado quando `defaultValue` muda.
 *
 * 2. Um `ref` reaplica o valor no DOM após a renderização. Sem isso o
 *    navegador cai na primeira <option> quando o valor é atribuído antes
 *    das options existirem, e o campo aparece vazio mesmo com o React
 *    tendo `value` correto nas props.
 */
export function CampoSelect({
  rotulo,
  nome,
  erros,
  children,
  defaultValue,
  ...props
}: Base & SelectHTMLAttributes<HTMLSelectElement>) {
  const temErro = Boolean(erros?.length);

  const inicial = String(defaultValue ?? '');
  const [valor, setValor] = useState(inicial);
  const [ultimoInicial, setUltimoInicial] = useState(inicial);
  const ref = useRef<HTMLSelectElement>(null);

  // O servidor devolveu outro valor (ex.: após erro de validação):
  // adota-o, mas sem descartar o que a pessoa escolher depois.
  if (inicial !== ultimoInicial) {
    setUltimoInicial(inicial);
    setValor(inicial);
  }

  // Garante que o DOM reflita o valor depois que as <option> existem.
  //
  // O React às vezes mantém `value` nas props sem aplicá-lo ao elemento —
  // acontece quando o valor chega junto com uma re-renderização vinda do
  // servidor. Reaplicar aqui, após o commit, resolve. O `children` entra nas
  // dependências porque a lista de options pode mudar.
  useEffect(() => {
    const el = ref.current;
    if (el && el.value !== valor) {
      el.value = valor;
    }
  });

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={nome} className="text-[13px] font-semibold text-slate-700">
        {rotulo}
        {props.required && <span className="text-emerald-600"> *</span>}
      </label>
      {/* `value`/`onChange` vêm DEPOIS de {...props} de propósito: espalhar
          por último sobrescreveria o controle do estado. */}
      <select
        ref={ref}
        id={nome}
        name={nome}
        className={classes(temErro)}
        aria-invalid={temErro}
        aria-describedby={temErro ? `${nome}-erro` : undefined}
        {...props}
        value={valor}
        onChange={(e) => {
          setValor(e.target.value);
          props.onChange?.(e);
        }}
      >
        {children}
      </select>
      <Erro nome={nome} erros={erros} />
    </div>
  );
}

export function CampoTextarea({
  rotulo,
  nome,
  erros,
  ...props
}: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const temErro = Boolean(erros?.length);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={nome} className="text-[13px] font-semibold text-slate-700">
        {rotulo}
      </label>
      <textarea
        id={nome}
        name={nome}
        rows={3}
        className={`${classes(temErro)} resize-y`}
        aria-invalid={temErro}
        {...props}
      />
      <Erro nome={nome} erros={erros} />
    </div>
  );
}
