# TCA Move — plataforma de fornecedores

Aplicação Next.js onde fornecedores se cadastram e gerenciam o estoque que
disponibilizam para a operação logística.

## Stack

| Camada | Escolha | Por quê |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) | Server Components + Server Actions, sem API REST separada |
| Linguagem | TypeScript | Tipos do banco gerados pelo Prisma chegam até a interface |
| Banco | PostgreSQL 18 | Já em uso na máquina |
| ORM | Prisma 7 | Migrations versionadas com histórico em `prisma/migrations` |
| Autenticação | Auth.js v5 (NextAuth) | Credentials agora, OAuth depois sem reescrever |
| Senhas | bcrypt (custo 12) | Padrão da indústria |
| Validação | Zod 4 | Mesmo schema no formulário e no servidor |
| Estilo | Tailwind 4 (painel) + CSS próprio (landing) | A landing veio pronta do design |

## Começando

```bash
cd app
npm install

cp .env.example .env      # preencha DATABASE_URL e AUTH_SECRET
npx auth secret           # gera um AUTH_SECRET novo

npm run db:migrate        # cria as tabelas
npm run db:seed           # dados de demonstração (opcional)
npm run dev
```

Abra `http://localhost:3000`.

**Conta de demonstração** (criada pelo seed): `demo@tcamove.local` / `Demo1234`

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run typecheck` | Checagem de tipos sem gerar arquivos |
| `npm run db:migrate` | Cria/aplica migration em desenvolvimento |
| `npm run db:deploy` | Aplica migrations em produção (não gera novas) |
| `npm run db:studio` | Interface visual do banco |
| `npm run db:seed` | Popula com dados de demonstração |
| `node scripts/teste-fluxo.mjs` | Testa cadastro, login, CRUD e autorização |
| `node scripts/ver-banco.mjs` | Mostra tabelas, colunas e chaves estrangeiras |
| `node scripts/limpar-teste.mjs` | Remove dados criados pelos testes |

## Estrutura

```
app/
  prisma/
    schema.prisma          Modelos do banco
    migrations/            Histórico versionado — nunca editar à mão
    seed.ts                Dados de demonstração
  prisma.config.ts         URL de conexão (Prisma 7 tirou do schema)
  src/
    auth.config.ts         Config do NextAuth SEM Prisma (usada no Edge)
    auth.ts                Config completa, com o provider Credentials
    proxy.ts               Proteção de rotas (era "middleware" até o Next 15)
    app/
      page.tsx             Landing pública
      (auth)/              entrar, cadastrar e as Server Actions
      painel/              Área logada
        produtos/          CRUD de estoque
      api/auth/            Handler do NextAuth
    components/            Campos de formulário, botões, blocos da landing
    lib/
      prisma.ts            Client singleton
      validacoes.ts        Schemas Zod
      cnpj.ts              Validação de CNPJ com dígito verificador
      upload.ts            Gravação de imagens
```

## Modelo de dados

```
usuarios (User)
  └── fornecedores (1:1)      razão social, CNPJ, telefone
        ├── enderecos (1:1)   CEP, logradouro, número, bairro, cidade, UF
        └── produtos (1:N)    imagem, peso, dimensões, volume, quantidade
```

Decisões que valem registro:

- **CNPJ sem máscara.** O banco guarda 14 dígitos; a formatação é aplicada
  só na exibição. Evita o mesmo CNPJ gravado de duas formas.
- **`Decimal`, não `Float`.** Peso e dimensões entram em cálculo de frete;
  ponto flutuante acumula erro de arredondamento.
- **`volume_m3` gravado, não calculado na consulta.** Permite ordenar e
  somar direto no banco. É derivado das dimensões no momento da escrita.
- **SKU único por fornecedor**, não global — dois fornecedores podem usar
  o mesmo código interno.
- **Sessão em JWT**, não em tabela. O provider Credentials não cria registro
  em `sessoes`, e o JWT evita uma consulta por requisição. As tabelas do
  adapter já existem para quando entrar OAuth.

## Segurança

- Senhas com bcrypt custo 12; o login gasta o mesmo tempo quando o e-mail
  não existe, para não revelar quais e-mails estão cadastrados.
- **Toda Server Action revalida a sessão.** Elas são alcançáveis por POST
  direto, sem passar pela interface — o `proxy.ts` é a primeira barreira,
  não a única.
- Ações sobre produto confirmam que o registro pertence ao fornecedor
  logado. Produto de outro fornecedor responde 404, não 403: não confirma
  que o registro existe.
- Nome de arquivo de upload é sempre gerado no servidor (UUID + extensão
  derivada do MIME), então nome malicioso não vira path traversal.
- `.env` está no `.gitignore`; só o `.env.example` é versionado.

Cobertura verificada por `scripts/teste-fluxo.mjs` (28 verificações):
CNPJ inválido, senha fraca, CNPJ duplicado, senha errada, isolamento entre
fornecedores e acesso anônimo.

## Migrations

Alterou o `schema.prisma`? Gere a migration:

```bash
npm run db:migrate -- --name descricao_curta
```

Isso cria `prisma/migrations/<data>_<nome>/migration.sql` — o histórico do
banco fica versionado no Git. Em produção use `npm run db:deploy`, que
aplica o que existe sem gerar migration nova.

Nunca edite um arquivo de migration já aplicado: crie outra.

## Uploads

As imagens vão para `public/uploads/produtos`. Serve para desenvolvimento e
para um servidor único.

**Antes de ir para produção**, se houver mais de uma instância ou deploy no
Vercel (disco efêmero), troque por S3 ou Cloudflare R2 — só o corpo de
`src/lib/upload.ts` muda.

## O que falta

Em ordem sugerida:

1. **Recuperação de senha** — token por e-mail. Hoje quem esquece a senha
   depende de intervenção manual no banco.
2. **Verificação de e-mail** no cadastro. A tabela `tokens_verificacao` já
   existe.
3. **Upload para storage externo** (ver acima).
4. **Paginação e busca** no estoque. A listagem carrega todos os produtos;
   a partir de algumas centenas isso pesa.
5. **Papel ADMIN** — o enum existe, mas não há tela para a TCA aprovar
   fornecedores ou ver o estoque consolidado.
6. **Testes automatizados no CI** — hoje `teste-fluxo.mjs` roda à mão e
   precisa do servidor de pé.
7. **Histórico de movimentação** de estoque (entradas e saídas), se a
   operação exigir rastreabilidade.
8. **Login OAuth** (Google/Microsoft), se os fornecedores preferirem.
