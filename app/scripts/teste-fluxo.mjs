/**
 * Teste do fluxo completo contra o servidor rodando em localhost:3000.
 * Uso: node scripts/teste-fluxo.mjs
 *
 * Exercita cadastro, login, CRUD de produtos e as regras de autorização.
 */
import 'dotenv/config';
import { Client } from 'pg';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const resultados = [];
const ok = (nome, passou, extra = '') =>
  resultados.push(`${passou ? 'OK  ' : 'FALHA'} ${nome}${extra ? ' — ' + extra : ''}`);

// CNPJs válidos (DV correto) gerados para o teste.
const CNPJ_A = '11444777000161';
const CNPJ_B = '34028316000103';

const carimbo = Date.now();
const usuarioA = { email: `fornecedor.a.${carimbo}@teste.local`, senha: 'Senha1234' };
const usuarioB = { email: `fornecedor.b.${carimbo}@teste.local`, senha: 'Senha1234' };

/** Cliente HTTP que guarda cookies entre requisições. */
function criarSessao() {
  const cookies = new Map();

  const guardar = (res) => {
    for (const linha of res.headers.getSetCookie?.() ?? []) {
      const [par] = linha.split(';');
      const idx = par.indexOf('=');
      cookies.set(par.slice(0, idx).trim(), par.slice(idx + 1).trim());
    }
  };

  const header = () =>
    [...cookies].map(([k, v]) => `${k}=${v}`).join('; ');

  return {
    async get(caminho, opcoes = {}) {
      const res = await fetch(BASE + caminho, {
        redirect: 'manual',
        headers: { cookie: header() },
        ...opcoes,
      });
      guardar(res);
      return res;
    },
    async post(caminho, corpo, opcoes = {}) {
      const res = await fetch(BASE + caminho, {
        method: 'POST',
        redirect: 'manual',
        // O Next 16 recusa Server Actions sem `origin` — o navegador
        // sempre manda, então o teste precisa mandar também.
        headers: { cookie: header(), origin: BASE },
        body: corpo,
        ...opcoes,
      });
      guardar(res);
      return res;
    },
    temSessao: () =>
      [...cookies.keys()].some((k) => k.includes('session-token')),
  };
}

/**
 * Lê os campos ocultos que o Next 16 injeta no <form> para identificar a
 * Server Action ($ACTION_REF_n, $ACTION_n:0, $ACTION_KEY). Submeter o
 * formulário exige reenviar esses campos, como o navegador faz.
 */
async function camposDaAcao(sessao, caminho, indiceForm = 0) {
  const html = await (await sessao.get(caminho)).text();

  const forms = [...html.matchAll(/<form[\s\S]*?<\/form>/g)].map((m) => m[0]);
  const alvo = forms[indiceForm];
  if (!alvo) return null;

  const campos = {};

  // Dois formatos coexistem:
  //  - Server Component: um único <input name="$ACTION_ID_<hash>"> sem value.
  //  - Client Component: $ACTION_REF_n (sem value) + $ACTION_n:0 / :1 e
  //    $ACTION_KEY (com value).
  for (const m of alvo.matchAll(/<input[^>]*name="(\$ACTION[^"]*)"[^>]*?>/g)) {
    const tag = m[0];
    const nome = m[1];
    const valor = /value="([^"]*)"/.exec(tag)?.[1] ?? '';

    campos[nome] = valor
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#x27;/g, "'");
  }

  return Object.keys(campos).length ? campos : null;
}

/** Submete o formulário para a Server Action, como faria o navegador. */
async function chamarAcao(sessao, caminho, campos, formData) {
  if (!campos) throw new Error(`Campos da action não encontrados em ${caminho}`);

  const fd = new FormData();
  // Os campos $ACTION_* vêm primeiro — a ordem importa para o Next.
  for (const [k, v] of Object.entries(campos)) fd.append(k, v);
  // `set` em vez de `append`: os dados do teste substituem os valores
  // que já vieram no HTML (ex.: o `id` do form de exclusão).
  for (const [k, v] of formData.entries()) fd.set(k, v);

  return sessao.post(caminho, fd);
}

const db = new Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

// Limpa restos de execuções anteriores.
await db.query(`DELETE FROM usuarios WHERE email LIKE '%@teste.local'`);
await db.query(`DELETE FROM fornecedores WHERE cnpj IN ($1,$2)`, [CNPJ_A, CNPJ_B]);

/* --------------------------- 1. Páginas públicas --------------------------- */
const anon = criarSessao();
ok('GET / responde 200', (await anon.get('/')).status === 200);
ok('GET /entrar responde 200', (await anon.get('/entrar')).status === 200);
ok('GET /cadastrar responde 200', (await anon.get('/cadastrar')).status === 200);

/* --------------------------- 2. Proteção de rota --------------------------- */
const painelAnon = await anon.get('/painel');
ok('painel bloqueado sem login', painelAnon.status === 307 || painelAnon.status === 302,
  `status ${painelAnon.status}`);
ok('redireciona para /entrar',
  (painelAnon.headers.get('location') || '').includes('/entrar'),
  painelAnon.headers.get('location') || '');

/* ------------------------------ 3. Cadastro ------------------------------- */
const sessaoA = criarSessao();
const acaoCadastro = await camposDaAcao(sessaoA, '/cadastrar');
ok('encontrou a action de cadastro', Boolean(acaoCadastro));

function formCadastro(email, cnpj, extra = {}) {
  const fd = new FormData();
  const dados = {
    nome: 'Fornecedor Teste', email, senha: 'Senha1234',
    confirmarSenha: 'Senha1234', razaoSocial: 'Teste Transportes Ltda',
    nomeFantasia: 'Teste Log', cnpj, telefone: '11988887777',
    cep: '01310100', logradouro: 'Av. Paulista', numero: '1000',
    complemento: '', bairro: 'Bela Vista', cidade: 'São Paulo', estado: 'SP',
    ...extra,
  };
  for (const [k, v] of Object.entries(dados)) fd.append(k, v);
  return fd;
}

// CNPJ inválido deve ser rejeitado.
const cnpjRuim = await chamarAcao(sessaoA, '/cadastrar', acaoCadastro,
  formCadastro(`ruim.${carimbo}@teste.local`, '11111111111111'));
const textoCnpjRuim = await cnpjRuim.text();
ok('rejeita CNPJ inválido', textoCnpjRuim.includes('CNPJ inválido') || textoCnpjRuim.includes('destacados'));
const contagemRuim = await db.query(
  `SELECT 1 FROM usuarios WHERE email = $1`, [`ruim.${carimbo}@teste.local`]);
ok('CNPJ inválido não gravou no banco', contagemRuim.rowCount === 0);

// Senha fraca deve ser rejeitada.
const senhaFraca = await chamarAcao(sessaoA, '/cadastrar', acaoCadastro,
  formCadastro(`fraca.${carimbo}@teste.local`, CNPJ_A, { senha: 'abc', confirmarSenha: 'abc' }));
await senhaFraca.text();
const fracaNoBanco = await db.query(
  `SELECT 1 FROM usuarios WHERE email = $1`, [`fraca.${carimbo}@teste.local`]);
ok('senha fraca não gravou no banco', fracaNoBanco.rowCount === 0);

// Cadastro válido.
await chamarAcao(sessaoA, '/cadastrar', acaoCadastro, formCadastro(usuarioA.email, CNPJ_A));
const criado = await db.query(
  `SELECT u.id, u.senha_hash, f.id AS forn_id, f.cnpj, e.cidade
   FROM usuarios u
   JOIN fornecedores f ON f.usuario_id = u.id
   JOIN enderecos e ON e.fornecedor_id = f.id
   WHERE u.email = $1`, [usuarioA.email]);
ok('cadastro válido criou usuário+fornecedor+endereço', criado.rowCount === 1);
ok('senha foi gravada com hash bcrypt',
  criado.rows[0]?.senha_hash?.startsWith('$2') === true);
ok('senha NÃO foi gravada em texto puro',
  criado.rows[0]?.senha_hash !== usuarioA.senha);
ok('CNPJ gravado só com dígitos', criado.rows[0]?.cnpj === CNPJ_A);

// CNPJ duplicado.
const dup = await chamarAcao(criarSessao(), '/cadastrar', acaoCadastro,
  formCadastro(`outro.${carimbo}@teste.local`, CNPJ_A));
await dup.text();
const qtdCnpj = await db.query(`SELECT COUNT(*)::int AS n FROM fornecedores WHERE cnpj = $1`, [CNPJ_A]);
ok('CNPJ duplicado foi recusado', qtdCnpj.rows[0].n === 1, `${qtdCnpj.rows[0].n} registros`);

/* -------------------------------- 4. Login -------------------------------- */
const login = criarSessao();
const acaoLogin = await camposDaAcao(login, '/entrar');

async function tentarLogin(sessao, email, senha) {
  const fd = new FormData();
  fd.append('email', email);
  fd.append('senha', senha);
  const res = await chamarAcao(sessao, '/entrar', acaoLogin, fd);
  await res.text();

  // O signIn responde 303; o cookie de sessão só se firma ao seguir o
  // redirect, como o navegador faria.
  const destino = res.headers.get('location');
  if (destino) {
    const caminho = destino.startsWith('http')
      ? new URL(destino).pathname
      : destino;
    await sessao.get(caminho);
  }

  return res;
}

await tentarLogin(login, usuarioA.email, 'SenhaErrada123');
ok('login com senha errada não cria sessão', !login.temSessao());

const loginBom = criarSessao();
await tentarLogin(loginBom, usuarioA.email, usuarioA.senha);
ok('login correto cria sessão', loginBom.temSessao());

const painelLogado = await loginBom.get('/painel');
ok('painel acessível após login', painelLogado.status === 200, `status ${painelLogado.status}`);

/* ------------------------------ 5. Produtos ------------------------------- */
const fornA = criado.rows[0].forn_id;
// Índice 1: o form 0 é o de "Sair", no cabeçalho do painel.
const acaoNovo = await camposDaAcao(loginBom, '/painel/produtos/novo', 1);
ok('encontrou a action de novo produto', Boolean(acaoNovo));

function formProduto(extra = {}) {
  const fd = new FormData();
  const d = {
    nome: 'Caixa reforçada', descricao: 'Papelão duplo', sku: `SKU-${carimbo}`,
    pesoKg: '1,5', alturaCm: '30', larguraCm: '40', comprimentoCm: '50',
    quantidade: '10', ...extra,
  };
  for (const [k, v] of Object.entries(d)) fd.append(k, v);
  return fd;
}

await chamarAcao(loginBom, '/painel/produtos/novo', acaoNovo, formProduto());
const prod = await db.query(
  `SELECT * FROM produtos WHERE fornecedor_id = $1`, [fornA]);
ok('produto criado', prod.rowCount === 1);
ok('peso aceitou vírgula (1,5 -> 1.5)', Number(prod.rows[0]?.peso_kg) === 1.5,
  String(prod.rows[0]?.peso_kg));
// 30 x 40 x 50 cm = 60000 cm³ = 0,06 m³
ok('volume calculado corretamente', Number(prod.rows[0]?.volume_m3) === 0.06,
  String(prod.rows[0]?.volume_m3));

// Dimensão negativa deve ser rejeitada.
await chamarAcao(loginBom, '/painel/produtos/novo', acaoNovo,
  formProduto({ sku: `NEG-${carimbo}`, alturaCm: '-5' }));
const negativo = await db.query(
  `SELECT 1 FROM produtos WHERE sku = $1`, [`NEG-${carimbo}`]);
ok('dimensão negativa rejeitada', negativo.rowCount === 0);

/* ---------------------- 6. Isolamento entre fornecedores ------------------- */
const sessaoB = criarSessao();
await chamarAcao(sessaoB, '/cadastrar', acaoCadastro, formCadastro(usuarioB.email, CNPJ_B));
const loginB = criarSessao();
await tentarLogin(loginB, usuarioB.email, usuarioB.senha);
ok('segundo fornecedor logou', loginB.temSessao());

const produtoDeA = prod.rows[0].id;

// B tenta ver o produto de A.
const verDeOutro = await loginB.get(`/painel/produtos/${produtoDeA}`);
ok('fornecedor B não vê produto de A (404)', verDeOutro.status === 404,
  `status ${verDeOutro.status}`);

// B tenta excluir o produto de A por POST direto.
// Os campos da action de exclusão são pegos na sessão de A (que tem o
// formulário renderizado), mas o POST vai com o cookie de B.
// Índice 1: form 0 é "Sair"; a partir do 1 vem um form de exclusão por produto.
const acaoExcluir = await camposDaAcao(loginBom, '/painel/produtos', 1);
ok('encontrou a action de excluir', Boolean(acaoExcluir));

if (acaoExcluir) {
  const fd = new FormData();
  fd.append('id', produtoDeA);
  await chamarAcao(loginB, '/painel/produtos', acaoExcluir, fd)
    .then((r) => r.text())
    .catch(() => {});
}
const aindaExiste = await db.query(`SELECT 1 FROM produtos WHERE id = $1`, [produtoDeA]);
ok('fornecedor B não conseguiu excluir produto de A', aindaExiste.rowCount === 1);

// Anônimo (sem cookie nenhum) tenta criar produto.
if (acaoNovo) {
  await chamarAcao(criarSessao(), '/painel/produtos/novo', acaoNovo,
    formProduto({ sku: `ANON-${carimbo}` })).then((r) => r.text()).catch(() => {});
}
const anonCriou = await db.query(`SELECT 1 FROM produtos WHERE sku = $1`, [`ANON-${carimbo}`]);
ok('anônimo não conseguiu criar produto', anonCriou.rowCount === 0);

// Anônimo tenta excluir produto de A.
if (acaoExcluir) {
  const fd = new FormData();
  fd.append('id', produtoDeA);
  await chamarAcao(criarSessao(), '/painel/produtos', acaoExcluir, fd)
    .then((r) => r.text())
    .catch(() => {});
}
const anonExcluiu = await db.query(`SELECT 1 FROM produtos WHERE id = $1`, [produtoDeA]);
ok('anônimo não conseguiu excluir produto', anonExcluiu.rowCount === 1);

/* -------------------------------- Resumo ---------------------------------- */
console.log(resultados.join('\n'));
const falhas = resultados.filter((r) => r.startsWith('FALHA')).length;
console.log(`\n${resultados.length - falhas}/${resultados.length} verificações passaram.`);

await db.query(`DELETE FROM usuarios WHERE email LIKE '%@teste.local'`);
await db.end();
process.exit(falhas ? 1 : 0);
