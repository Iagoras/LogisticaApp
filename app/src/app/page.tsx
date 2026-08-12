import Link from 'next/link';

import { auth } from '@/auth';
import { clientes, cobertura, passos, servicos } from '@/lib/conteudo-landing';
import { Cabecalho } from '@/components/landing/cabecalho';
import { NumerosHero } from '@/components/landing/numeros';
import {
  CartaoCarga,
  ProvedorRastreio,
  SecaoRastreio,
} from '@/components/landing/rastreio';
import { FormularioContato } from '@/components/landing/contato';
import { Revelar } from '@/components/landing/revelar';

export default async function PaginaInicial() {
  // O cabeçalho muda para quem já está logado.
  const sessao = await auth();
  const logado = Boolean(sessao?.user);

  return (
    <ProvedorRastreio>
      {/* `pagina-publica` escopa os estilos da landing (ver landing.css). */}
      <div className="pagina-publica">
      <Cabecalho logado={logado} />

      <main id="topo">
        {/* ============================ Hero ============================ */}
        <section className="hero">
          <div className="hero__texto">
            <div className="selo">
              <span className="selo__tag">NOVO</span>
              <span className="selo__texto">
                Roteirização com IA em 22 estados
              </span>
            </div>

            <h1 className="hero__titulo">
              Sua carga em
              <br />
              <span className="gradiente-texto">movimento constante</span>
            </h1>

            <p className="hero__descricao">
              Transporte rodoviário, armazenagem e last mile em uma só operação.
              Visibilidade em tempo real do coleta ao destinatário — sem
              planilha, sem telefonema.
            </p>

            <div className="hero__acoes">
              <Link href="/cadastrar" className="btn btn--escuro">
                Cadastrar minha empresa
              </Link>
              <a href="#rastreio" className="btn btn--claro">
                Rastrear pedido
              </a>
            </div>

            <NumerosHero />
          </div>

          <div className="hero__visual">
            <div className="hero__imagem">
              {/* Troque por <Image src="/frota.jpg" … /> quando houver foto. */}
              <svg
                viewBox="0 0 600 560"
                width="100%"
                height="100%"
                role="img"
                aria-label="Foto da frota"
              >
                <rect width="600" height="560" fill="#0B231D" />
                <path d="M0 400 L600 340 L600 560 L0 560 Z" fill="#122F27" />
                <circle cx="470" cy="120" r="58" fill="#15A182" opacity="0.25" />
                <rect x="120" y="300" width="230" height="90" rx="12" fill="#1B3D33" />
                <rect x="350" y="325" width="120" height="65" rx="10" fill="#15A182" opacity="0.5" />
                <circle cx="185" cy="400" r="26" fill="#0A1C17" />
                <circle cx="400" cy="400" r="26" fill="#0A1C17" />
              </svg>
            </div>

            <CartaoCarga />
          </div>
        </section>

        {/* ========================== Clientes ========================== */}
        <Revelar className="faixa-clientes">
          <div className="faixa-clientes__interno">
            <span className="faixa-clientes__rotulo">OPERAMOS PARA</span>
            {clientes.map((nome) => (
              <span className="cliente" key={nome}>
                {nome}
              </span>
            ))}
          </div>
        </Revelar>

        {/* ========================== Soluções ========================== */}
        <Revelar>
          <section className="solucoes" id="solucoes">
            <div className="solucoes__cabecalho">
              <div className="solucoes__intro">
                <span className="olho">SOLUÇÕES</span>
                <h2 className="secao__titulo">
                  Uma malha logística inteira sob um contrato só
                </h2>
              </div>
              <p className="solucoes__apoio">
                Integramos coleta, armazenagem e distribuição com SLA único e um
                painel de controle compartilhado com o seu time.
              </p>
            </div>

            <div className="grade-servicos">
              {servicos.map((s) => (
                <article className="servico" key={s.n}>
                  <div
                    className="servico__numero"
                    style={{ background: s.tom }}
                  >
                    {s.n}
                  </div>
                  <h3 className="servico__titulo">{s.titulo}</h3>
                  <p className="servico__texto">{s.texto}</p>
                  <span className="servico__metrica">{s.metrica}</span>
                </article>
              ))}
            </div>
          </section>
        </Revelar>

        {/* ========================== Rastreio ========================== */}
        <SecaoRastreio />

        {/* ========================= Cobertura ========================== */}
        <Revelar>
          <section className="cobertura" id="cobertura">
            <div className="cobertura__imagem">
              <svg
                viewBox="0 0 600 520"
                width="100%"
                height="100%"
                role="img"
                aria-label="Mapa de cobertura"
              >
                <rect width="600" height="520" fill="#DCE7D6" />
                <path d="M300 60 L430 180 L400 380 L220 400 L160 220 Z" fill="#C2DBB6" />
                <circle cx="300" cy="230" r="9" fill="#15A182" />
                <circle cx="380" cy="310" r="7" fill="#53B568" />
                <circle cx="230" cy="300" r="7" fill="#53B568" />
                <path
                  d="M300 230 L380 310 M300 230 L230 300"
                  stroke="#15A182"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                />
              </svg>
            </div>

            <div className="cobertura__texto">
              <span className="olho">COBERTURA</span>
              <h2 className="cobertura__titulo">
                Do porto de Santos ao interior do Pará
              </h2>
              <p className="cobertura__descricao">
                Nove centros de distribuição próprios e uma malha de parceiros
                homologados garantem coleta em até 4 horas nas capitais.
              </p>

              <div className="grade-cobertura">
                {cobertura.map((c) => (
                  <div className="indicador" key={c.rotulo}>
                    <span className="indicador__valor">{c.valor}</span>
                    <span className="indicador__rotulo">{c.rotulo}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </Revelar>

        {/* ========================== Processo ========================== */}
        <Revelar>
          <section className="processo" id="processo">
            <div className="processo__cartao">
              <div className="processo__cabecalho">
                <h2 className="processo__titulo">
                  Quatro passos entre o pedido e o comprovante assinado
                </h2>
                <Link href="/cadastrar" className="btn btn--contraste">
                  Começar agora
                </Link>
              </div>

              <div className="grade-processo">
                {passos.map((p) => (
                  <div className="passo" key={p.n}>
                    <span className="passo__numero">{p.n}</span>
                    <h3 className="passo__titulo">{p.titulo}</h3>
                    <p className="passo__texto">{p.texto}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </Revelar>

        {/* ===================== Depoimento + contato ==================== */}
        <Revelar>
          <section className="fechamento">
            <figure className="depoimento">
              <span className="depoimento__aspas" aria-hidden="true">
                &rdquo;
              </span>
              <blockquote className="depoimento__texto">
                Trocamos quatro transportadoras por uma. O custo por volume caiu
                19% e finalmente paramos de descobrir atraso pelo cliente.
              </blockquote>
              <figcaption className="depoimento__autor">
                <div className="depoimento__avatar">
                  <svg viewBox="0 0 48 48" width="100%" height="100%" role="img" aria-label="">
                    <rect width="48" height="48" fill="#E7F4DE" />
                    <circle cx="24" cy="19" r="8" fill="#B7D6A2" />
                    <path d="M8 48c0-9 7-15 16-15s16 6 16 15z" fill="#B7D6A2" />
                  </svg>
                </div>
                <div>
                  <span className="depoimento__nome">Marina Sacchetto</span>
                  <br />
                  <span className="depoimento__cargo">
                    Diretora de Supply Chain, Verdemar Alimentos
                  </span>
                </div>
              </figcaption>
            </figure>

            <FormularioContato />
          </section>
        </Revelar>
      </main>

      {/* =========================== Rodapé =========================== */}
      <footer className="rodape">
        <div className="rodape__interno">
          <div className="rodape__marca">
            <div className="rodape__logo">
              <span className="rodape__logo-icone" aria-hidden="true" />
              <span className="rodape__logo-nome">TCA Move</span>
            </div>
            <p className="rodape__legal">
              Operador logístico integrado. ANTT 4432198 · CNPJ
              12.345.678/0001-90
            </p>
          </div>

          <div className="rodape__colunas">
            <div className="rodape__coluna">
              <span className="rodape__titulo">SERVIÇOS</span>
              <a href="#solucoes">Carga fracionada</a>
              <a href="#solucoes">Armazenagem</a>
              <a href="#solucoes">Last mile</a>
            </div>
            <div className="rodape__coluna">
              <span className="rodape__titulo">EMPRESA</span>
              <a href="#cobertura">Cobertura</a>
              <a href="#processo">Como funciona</a>
              <a href="#contato">Contato</a>
            </div>
            <div className="rodape__coluna">
              <span className="rodape__titulo">FORNECEDORES</span>
              <Link href="/cadastrar">Cadastrar empresa</Link>
              <Link href="/entrar">Acessar painel</Link>
              <span>comercial@tcamove.com.br</span>
            </div>
          </div>
        </div>

        <div className="rodape__base">
          <span>© {new Date().getFullYear()} TCA Move Logística</span>
          <span>Política de privacidade · Termos</span>
        </div>
      </footer>
      </div>
    </ProvedorRastreio>
  );
}
