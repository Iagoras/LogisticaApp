/**
 * Campos de formulário com rótulo, erro e estilo consistentes.
 */

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

export function CampoSelect({
  rotulo,
  nome,
  erros,
  children,
  ...props
}: Base & SelectHTMLAttributes<HTMLSelectElement>) {
  const temErro = Boolean(erros?.length);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={nome} className="text-[13px] font-semibold text-slate-700">
        {rotulo}
        {props.required && <span className="text-emerald-600"> *</span>}
      </label>
      <select
        id={nome}
        name={nome}
        className={classes(temErro)}
        aria-invalid={temErro}
        {...props}
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
