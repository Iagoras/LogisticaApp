'use client';

import { useActionState } from 'react';
import Link from 'next/link';

import { cadastrarFornecedor, type EstadoFormulario } from '../acoes';
import { Campo, CampoSelect } from '@/components/campo';
import { BotaoEnviar } from '@/components/botao-enviar';

const ESTADO_INICIAL: EstadoFormulario = {};

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

function Secao({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-slate-900/8 bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold tracking-tight text-slate-900">
          {titulo}
        </h2>
        <p className="text-[14px] text-slate-600">{descricao}</p>
      </div>
      {children}
    </section>
  );
}

export function FormularioCadastro() {
  const [estado, acao] = useActionState(cadastrarFornecedor, ESTADO_INICIAL);
  const erros = estado.camposComErro;

  return (
    <form action={acao} className="flex flex-col gap-6" noValidate>
      {estado.erro && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700"
        >
          {estado.erro}
        </p>
      )}

      <Secao
        titulo="Dados de acesso"
        descricao="Usados para entrar no painel."
      >
        <Campo
          rotulo="Seu nome"
          nome="nome"
          autoComplete="name"
          placeholder="Maria Silva"
          required
          erros={erros?.nome}
        />
        <Campo
          rotulo="E-mail"
          nome="email"
          type="email"
          autoComplete="email"
          placeholder="voce@empresa.com.br"
          required
          erros={erros?.email}
        />
        <div className="grid gap-5 md:grid-cols-2">
          <Campo
            rotulo="Senha"
            nome="senha"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            required
            dica="Mínimo 8 caracteres, com letra e número."
            erros={erros?.senha}
          />
          <Campo
            rotulo="Confirmar senha"
            nome="confirmarSenha"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            required
            erros={erros?.confirmarSenha}
          />
        </div>
      </Secao>

      <Secao
        titulo="Dados da empresa"
        descricao="O CNPJ identifica sua empresa na plataforma."
      >
        <Campo
          rotulo="Razão social"
          nome="razaoSocial"
          autoComplete="organization"
          placeholder="Transportes Silva Ltda"
          required
          erros={erros?.razaoSocial}
        />
        <Campo
          rotulo="Nome fantasia"
          nome="nomeFantasia"
          placeholder="Silva Log"
          erros={erros?.nomeFantasia}
        />
        <div className="grid gap-5 md:grid-cols-2">
          <Campo
            rotulo="CNPJ"
            nome="cnpj"
            inputMode="numeric"
            placeholder="00.000.000/0000-00"
            required
            dica="Pode digitar com ou sem pontuação."
            erros={erros?.cnpj}
          />
          <Campo
            rotulo="Telefone"
            nome="telefone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="(11) 90000-0000"
            erros={erros?.telefone}
          />
        </div>
      </Secao>

      <Secao titulo="Endereço" descricao="Onde fica a sede da empresa.">
        <div className="grid gap-5 md:grid-cols-[200px_1fr]">
          <Campo
            rotulo="CEP"
            nome="cep"
            inputMode="numeric"
            placeholder="00000-000"
            required
            erros={erros?.cep}
          />
          <Campo
            rotulo="Logradouro"
            nome="logradouro"
            autoComplete="street-address"
            placeholder="Av. Paulista"
            required
            erros={erros?.logradouro}
          />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Campo
            rotulo="Número"
            nome="numero"
            placeholder="1000"
            required
            erros={erros?.numero}
          />
          <Campo
            rotulo="Complemento"
            nome="complemento"
            placeholder="Sala 12"
            erros={erros?.complemento}
          />
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <Campo
            rotulo="Bairro"
            nome="bairro"
            placeholder="Bela Vista"
            required
            erros={erros?.bairro}
          />
          <Campo
            rotulo="Cidade"
            nome="cidade"
            placeholder="São Paulo"
            required
            erros={erros?.cidade}
          />
          <CampoSelect
            rotulo="Estado"
            nome="estado"
            required
            defaultValue=""
            erros={erros?.estado}
          >
            <option value="" disabled>
              UF
            </option>
            {UFS.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </CampoSelect>
        </div>
      </Secao>

      <div className="flex flex-col items-center gap-4">
        <BotaoEnviar carregando="Criando conta…">Criar conta</BotaoEnviar>
        <p className="text-[14px] text-slate-600">
          Já tem conta?{' '}
          <Link
            href="/entrar"
            className="font-semibold text-emerald-700 hover:underline"
          >
            Entrar
          </Link>
        </p>
      </div>
    </form>
  );
}
