# LogisticaApp — TCA Move

Aplicação de Logística focada em localização e melhora de rotas comerciais.

Plataforma onde fornecedores se cadastram e registram o estoque que
disponibilizam para a operação logística da TCA Move.

## Onde está o quê

```
app/          Aplicação Next.js — é aqui que o desenvolvimento acontece
index.html    Site estático original (portado para app/, mantido como referência)
css/  js/     Fontes do site estático
```

O site estático foi a primeira versão, feita a partir do design. Ele foi
**portado para dentro de `app/`** como a página pública da aplicação
(`app/src/app/page.tsx`); os arquivos da raiz ficam como referência do
ponto de partida e podem ser removidos quando não forem mais úteis.

## Rodando

```bash
cd app
npm install
cp .env.example .env    # preencha DATABASE_URL e AUTH_SECRET
npm run db:migrate
npm run db:seed
npm run dev
```

Detalhes de arquitetura, decisões de modelagem, segurança e o que falta
implementar estão em [app/README.md](app/README.md).
