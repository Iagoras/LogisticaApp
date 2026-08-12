/**
 * dados.js — Fonte de dados do site.
 *
 * Tudo que era `renderVals()` no componente do Claude Design vive aqui.
 * Quando houver uma API de verdade, basta trocar `buscarRastreio()` por
 * uma chamada `fetch` — o resto do site não muda.
 */

export const marca = 'TCA Move';

export const clientes = [
  'Verdemar',
  'Aurora Foods',
  'Casa Nova',
  'Petrolar',
  'Grão Sul',
];

export const servicos = [
  {
    n: '01',
    titulo: 'Carga fracionada',
    texto: 'Consolidação inteligente de cargas LTL com saídas diárias entre os principais eixos.',
    metrica: 'Saídas diárias',
    tom: '#E7F4DE',
  },
  {
    n: '02',
    titulo: 'Armazenagem',
    texto: '9 centros próprios com WMS integrado, câmara fria e inventário cíclico auditado.',
    metrica: '142 mil m²',
    tom: '#DFF0E4',
  },
  {
    n: '03',
    titulo: 'Last mile',
    texto: 'Frota leve e parceiros homologados para entrega no mesmo dia em 18 capitais.',
    metrica: 'Same day',
    tom: '#D8EFEA',
  },
  {
    n: '04',
    titulo: 'Torre de controle',
    texto: 'Time dedicado monitorando desvios de rota, temperatura e SLA 24 por 7.',
    metrica: '24/7 ativo',
    tom: '#E7F4DE',
  },
];

export const cobertura = [
  { valor: '9', rotulo: 'Centros de distribuição' },
  { valor: '4h', rotulo: 'Coleta nas capitais' },
  { valor: '1.860', rotulo: 'Veículos na malha' },
  { valor: '22', rotulo: 'Estados atendidos' },
];

export const passos = [
  {
    n: 'PASSO 01',
    titulo: 'Diagnóstico',
    texto: 'Mapeamos volumes, rotas e gargalos da sua operação atual em uma semana.',
  },
  {
    n: 'PASSO 02',
    titulo: 'Desenho da malha',
    texto: 'Propomos rotas, CDs e modais com custo por entrega aberto na planilha.',
  },
  {
    n: 'PASSO 03',
    titulo: 'Integração',
    texto: 'Conectamos ERP e e-commerce via API ou EDI, sem trabalho do seu time.',
  },
  {
    n: 'PASSO 04',
    titulo: 'Operação viva',
    texto: 'Painel em tempo real, comprovante digital e revisão mensal de indicadores.',
  },
];

export const numerosHero = [
  { valor: 98.4, sufixo: '%', decimais: 1, rotulo: 'Entregas no prazo' },
  { valor: 4200, sufixo: '', decimais: 0, rotulo: 'Municípios atendidos' },
  { valor: 1.2, sufixo: 'M', decimais: 1, rotulo: 'Volumes por mês' },
];

/** Código exibido por padrão no painel e no cartão flutuante do hero. */
export const CODIGO_PADRAO = 'RV-88421';

/**
 * Base de cargas simulada. Cada etapa tem `concluida`; a última concluída
 * é marcada como "atual" na linha do tempo pela camada de renderização.
 */
const cargas = {
  'RV-88421': {
    codigo: 'RV-88421',
    rota: 'Campinas, SP → Curitiba, PR',
    status: 'Em trânsito',
    progresso: 72,
    etapas: [
      { titulo: 'Coleta realizada', local: 'CD Campinas · Doca 7', hora: 'Ter, 06h12', concluida: true },
      { titulo: 'Em trânsito', local: 'Rodovia Régis Bittencourt, km 312', hora: 'Ter, 11h48', concluida: true },
      { titulo: 'Chegada no CD Curitiba', local: 'Previsto', hora: 'Ter, 16h20', concluida: false },
      { titulo: 'Saiu para entrega', local: 'Previsto', hora: 'Ter, 18h40', concluida: false },
    ],
  },
  'RV-77310': {
    codigo: 'RV-77310',
    rota: 'Recife, PE → Fortaleza, CE',
    status: 'Entregue',
    progresso: 100,
    etapas: [
      { titulo: 'Coleta realizada', local: 'CD Recife · Doca 2', hora: 'Seg, 05h40', concluida: true },
      { titulo: 'Em trânsito', local: 'BR-101 · Natal', hora: 'Seg, 13h05', concluida: true },
      { titulo: 'Saiu para entrega', local: 'Base Fortaleza', hora: 'Ter, 07h30', concluida: true },
      { titulo: 'Entregue', local: 'Recebido por J. Alencar', hora: 'Ter, 10h14', concluida: true },
    ],
  },
};

/** Normaliza o que o usuário digita: "rv 88421", "rv88421" → "RV-88421". */
export function normalizarCodigo(entrada) {
  const limpo = String(entrada || '')
    .trim()
    .toUpperCase()
    .replace(/[\s.]/g, '');

  // Aceita o código com ou sem hífen entre as letras e os dígitos.
  const partes = /^([A-Z]{2})-?(\d{3,8})$/.exec(limpo);
  return partes ? `${partes[1]}-${partes[2]}` : limpo;
}

/**
 * Consulta uma carga. Assíncrona de propósito: o dia em que isso virar
 * um endpoint real, só o corpo da função muda.
 *
 * @param {string} codigo
 * @returns {Promise<{ok: boolean, carga: object, solicitado: string}>}
 */
export function buscarRastreio(codigo) {
  const chave = normalizarCodigo(codigo);

  return new Promise((resolve) => {
    // Latência simulada para o estado de carregamento aparecer.
    setTimeout(() => {
      const encontrada = cargas[chave];
      resolve({
        ok: Boolean(encontrada),
        carga: encontrada || cargas[CODIGO_PADRAO],
        solicitado: chave,
      });
    }, 420);
  });
}

/** Códigos válidos — usados para montar a mensagem de ajuda. */
export function codigosDisponiveis() {
  return Object.keys(cargas);
}
