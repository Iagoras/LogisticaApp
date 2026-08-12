# LogisticaApp — TCA Move

Aplicação de Logística focada em localização e melhora de rotas comerciais.

Site institucional da TCA Move, portado do design Claude
(`Rota Verde - Site.dc.html`) para HTML + CSS + JavaScript puro — sem
frameworks, sem build, sem dependências.

## Como rodar

Os módulos ES exigem HTTP (não funcionam abrindo o arquivo via `file://`):

```bash
npx serve .
# ou
python -m http.server 4173
```

Depois abra `http://localhost:4173`.

## Estrutura

```
index.html          Marcação da página
css/style.css       Estilos (variáveis CSS + responsivo)
js/
  app.js            Ponto de entrada — inicializa tudo
  dados.js          Conteúdo e "API" de rastreio simulada
  dom.js            Auxiliares de DOM (criar, pegar, formatar)
  secoes.js         Renderiza as listas (serviços, clientes, passos…)
  rastreio.js       Busca de carga e linha do tempo
  interface.js      Menu, rolagem, contadores, animações, formulários
assets/             Imagens do site (hoje há placeholders SVG no HTML)
```

## O que é dinâmico

- **Rastreio** — busca por código com estado de carregamento, normalização
  da entrada (`rv77310` → `RV-77310`), linha do tempo montada a partir dos
  dados e aviso quando o código não existe. Códigos de teste: `RV-88421`
  (em trânsito) e `RV-77310` (entregue).
- **Cartão do hero** — sincronizado com o painel de rastreio.
- **Números do hero** — contagem animada ao entrar na tela.
- **Menu mobile**, rolagem suave e destaque do link da seção atual.
- **Formulário de cotação** com validação de e-mail.

## Trocar dados por uma API real

Todo o conteúdo vive em [dados.js](js/dados.js). Para ligar a um backend,
basta trocar o corpo de `buscarRastreio()` — ela já é assíncrona e retorna
uma `Promise`, então o resto do site não muda:

```js
export async function buscarRastreio(codigo) {
  const chave = normalizarCodigo(codigo);
  const resposta = await fetch(`/api/rastreio/${chave}`);
  if (!resposta.ok) return { ok: false, carga: /* fallback */, solicitado: chave };
  return { ok: true, carga: await resposta.json(), solicitado: chave };
}
```

## Imagens

Os três espaços de imagem são SVGs inline no HTML, marcados com um
comentário. Substitua por `<img>` apontando para `assets/`:

- Hero — foto da frota
- Cobertura — mapa ou centro de distribuição
- Depoimento — foto de perfil

## Acessibilidade

Navegação por teclado, `aria-live` nos painéis que mudam sozinhos, rótulos
associados aos campos, foco visível e respeito a `prefers-reduced-motion`
(com movimento reduzido os números aparecem já no valor final, sem depender
de rolagem).
