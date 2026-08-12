/**
 * Verifica que um erro de validação NÃO apaga o que a pessoa digitou.
 * Uso: node scripts/teste-preservar.mjs
 */
import 'dotenv/config';
import { Client } from 'pg';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const resultados = [];
const ok = (nome, passou, extra = '') =>
  resultados.push(`${passou ? 'OK  ' : 'FALHA'} ${nome}${extra ? ' — ' + extra : ''}`);

const carimbo = Date.now();

function criarSessao() {
  const cookies = new Map();
  const guardar = (res) => {
    for (const l of res.headers.getSetCookie?.() ?? []) {
      const [par] = l.split(';');
      const i = par.indexOf('=');
      cookies.set(par.slice(0, i).trim(), par.slice(i + 1).trim());
    }
  };
  const header = () => [...cookies].map(([k, v]) => `${k}=${v}`).join('; ');

  return {
    async get(caminho) {
      const res = await fetch(BASE + caminho, {
        redirect: 'manual', headers: { cookie: header() },
      });
      guardar(res);
      return res;
    },
    async post(caminho, corpo) {
      const res = await fetch(BASE + caminho, {
        method: 'POST', redirect: 'manual', body: corpo,
        headers: { cookie: header(), origin: BASE },
      });
      guardar(res);
      return res;
    },
    temSessao: () => [...cookies.keys()].some((k) => k.includes('session-token')),
  };
}

async function camposDaAcao(sessao, caminho, indiceForm = 0) {
  const html = await (await sessao.get(caminho)).text();
  const forms = [...html.matchAll(/<form[\s\S]*?<\/form>/g)].map((m) => m[0]);
  const alvo = forms[indiceForm];
  if (!alvo) return null;
  const campos = {};
  for (const m of alvo.matchAll(/<input[^>]*name="(\$ACTION[^"]*)"[^>]*?>/g)) {
    const valor = /value="([^"]*)"/.exec(m[0])?.[1] ?? '';
    campos[m[1]] = valor
      .replace(/&quot;/g, '"').replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x27;/g, "'");
  }
  return Object.keys(campos).length ? campos : null;
}

async function chamarAcao(sessao, caminho, campos, dados) {
  const fd = new FormData();
  for (const [k, val] of Object.entries(campos)) fd.append(k, val);
  for (const [k, val] of Object.entries(dados)) fd.set(k, val);
  return sessao.post(caminho, fd);
}

/** Lê o `value` de um input pelo atributo name, no HTML devolvido. */
function valorDe(html, nome) {
  // O React serializa como <input ... name="x" ... value="y" ...>, mas a
  // ordem dos atributos varia; procuramos a tag inteira primeiro.
  const tag = new RegExp(`<(?:input|textarea|select)[^>]*name="${nome}"[^>]*>`, 'i').exec(html);
  if (!tag) return null;
  return /value="([^"]*)"/.exec(tag[0])?.[1] ?? null;
}

/** Para <select>, o valor selecionado vem em <option ... selected>. */
function selecionadoDe(html, nome) {
  const bloco = new RegExp(`<select[^>]*name="${nome}"[^>]*>([\\s\\S]*?)</select>`, 'i').exec(html);
  if (!bloco) return null;
  const opt = /<option[^>]*selected[^>]*value="([^"]*)"|<option[^>]*value="([^"]*)"[^>]*selected/i.exec(bloco[1]);
  return opt ? (opt[1] ?? opt[2]) : null;
}

const db = new Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
await db.query(`DELETE FROM usuarios WHERE email LIKE '%@preserva.local'`);

/* ===================== 1. Cadastro com CNPJ inválido ===================== */
const s = criarSessao();
const acaoCadastro = await camposDaAcao(s, '/cadastrar');

const DADOS = {
  nome: 'Maria Silva Santos',
  email: `maria.${carimbo}@preserva.local`,
  senha: 'Senha1234',
  confirmarSenha: 'Senha1234',
  razaoSocial: 'Transportes Silva Ltda',
  nomeFantasia: 'Silva Log',
  cnpj: '11111111111111',            // <- inválido de propósito
  telefone: '11988887777',
  cep: '01310100',
  logradouro: 'Av. Paulista',
  numero: '1000',
  complemento: 'Sala 12',
  bairro: 'Bela Vista',
  cidade: 'São Paulo',
  estado: 'SP',
};

const resp = await chamarAcao(s, '/cadastrar', acaoCadastro, DADOS);
const html = await resp.text();

ok('erro foi exibido', /destacados|inválido/i.test(html));

// Todo campo não sensível deve voltar preenchido.
const preservar = [
  'nome', 'email', 'razaoSocial', 'nomeFantasia', 'cnpj', 'telefone',
  'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade',
];
for (const campo of preservar) {
  const lido = valorDe(html, campo);
  ok(`preservou "${campo}"`, lido === DADOS[campo], `esperava "${DADOS[campo]}", veio "${lido}"`);
}
ok('preservou "estado" (select)', selecionadoDe(html, 'estado') === 'SP',
  String(selecionadoDe(html, 'estado')));

// As senhas NÃO podem voltar.
ok('senha NÃO voltou no HTML', !html.includes(DADOS.senha), 'a senha apareceu no HTML!');
ok('campo senha veio vazio', (valorDe(html, 'senha') ?? '') === '');
ok('campo confirmarSenha veio vazio', (valorDe(html, 'confirmarSenha') ?? '') === '');
ok('avisa para redigitar a senha', /digite a senha novamente/i.test(html));

/* ================== 2. Cadastro com CNPJ já cadastrado ================== */
const CNPJ_BOM = '11444777000161';
const s2 = criarSessao();
await chamarAcao(s2, '/cadastrar', acaoCadastro, {
  ...DADOS, email: `primeiro.${carimbo}@preserva.local`, cnpj: CNPJ_BOM,
});

const s3 = criarSessao();
const resp3 = await chamarAcao(s3, '/cadastrar', acaoCadastro, {
  ...DADOS, email: `segundo.${carimbo}@preserva.local`, cnpj: CNPJ_BOM,
  cidade: 'Campinas',
});
const html3 = await resp3.text();
ok('avisa CNPJ duplicado', /já está cadastrado|já cadastrado/i.test(html3));
ok('preservou cidade no erro de duplicidade',
  valorDe(html3, 'cidade') === 'Campinas', String(valorDe(html3, 'cidade')));
ok('preservou razão social no erro de duplicidade',
  valorDe(html3, 'razaoSocial') === DADOS.razaoSocial);

/* ======================= 3. Login com senha errada ======================= */
const sl = criarSessao();
const acaoLogin = await camposDaAcao(sl, '/entrar');
const respLogin = await chamarAcao(sl, '/entrar', acaoLogin, {
  email: `primeiro.${carimbo}@preserva.local`, senha: 'SenhaErrada99',
});
const htmlLogin = await respLogin.text();
ok('login errado mostra erro', /incorreto/i.test(htmlLogin));
ok('login preservou o e-mail',
  valorDe(htmlLogin, 'email') === `primeiro.${carimbo}@preserva.local`,
  String(valorDe(htmlLogin, 'email')));
ok('login NÃO devolveu a senha', !htmlLogin.includes('SenhaErrada99'));

/* ==================== 4. Produto com dimensão inválida =================== */
const sp = criarSessao();
await chamarAcao(sp, '/entrar', acaoLogin, {
  email: `primeiro.${carimbo}@preserva.local`, senha: 'Senha1234',
});
// segue o redirect para firmar a sessão
await sp.get('/painel');
ok('logou para testar produtos', sp.temSessao());

if (sp.temSessao()) {
  const acaoNovo = await camposDaAcao(sp, '/painel/produtos/novo', 1);
  const PROD = {
    nome: 'Caixa reforçada especial',
    descricao: 'Papelão duplo com reforço',
    sku: `SKU-${carimbo}`,
    pesoKg: '2,5',
    alturaCm: '-10',          // <- inválido de propósito
    larguraCm: '40',
    comprimentoCm: '55',
    quantidade: '25',
  };
  const respProd = await chamarAcao(sp, '/painel/produtos/novo', acaoNovo, PROD);
  const htmlProd = await respProd.text();

  ok('produto: erro exibido', /destacados|maior que zero/i.test(htmlProd));
  for (const campo of ['nome', 'sku', 'pesoKg', 'larguraCm', 'comprimentoCm', 'quantidade']) {
    ok(`produto preservou "${campo}"`,
      valorDe(htmlProd, campo) === PROD[campo],
      `esperava "${PROD[campo]}", veio "${valorDe(htmlProd, campo)}"`);
  }
  // textarea guarda o conteúdo entre as tags, não em value
  const ta = /<textarea[^>]*name="descricao"[^>]*>([\s\S]*?)<\/textarea>/i.exec(htmlProd);
  ok('produto preservou "descricao"', ta?.[1] === PROD.descricao,
    `veio "${ta?.[1]}"`);
}

/* ------------------------------- Resumo -------------------------------- */
console.log(resultados.join('\n'));
const falhas = resultados.filter((r) => r.startsWith('FALHA')).length;
console.log(`\n${resultados.length - falhas}/${resultados.length} verificações passaram.`);

await db.query(`DELETE FROM usuarios WHERE email LIKE '%@preserva.local'`);
await db.end();
process.exit(falhas ? 1 : 0);
