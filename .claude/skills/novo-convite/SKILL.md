---
name: novo-convite
description: Cria um novo convite individual (template + evento) a partir de uma imagem de arte enviada pelo usuário. Lê a imagem, extrai paleta/estilo, gera tema CSS com ornamentos flutuantes, shell HTML e assets, e registra o evento como rascunho no Supabase. Use quando o usuário pedir para criar um novo convite, template ou front-end de convite a partir de uma imagem/arte.
---

# Novo convite a partir de uma imagem

Você vai criar um **front-end individual de convite** mantendo as características do layout base
(hero com imagem e overlay, ornamentos flutuando com parallax, contador regressivo, seções com
reveal, formulário RSVP, rodapé) — com identidade visual extraída da arte enviada.

O motor de renderização já é 100% dirigido por dados: você NÃO altera `app.js` nem `styles.css`.
Todo o visual novo vive em um arquivo `themes/<slug>.css` + registros no Supabase.

## 1. Colete as entradas (pergunte o que faltar)

- **Imagem da arte** (caminho local do upload) — obrigatória
- **slug** (minúsculas, sem acento, ex.: `casamento-ana-joao`)
- **Nome do evento**, **data/hora** (fuso America/Sao_Paulo, formato `YYYY-MM-DD HH:MM-03`)
- **Local** (nome, endereço, URL do Maps se houver), **WhatsApp com DDI**
- Briefing opcional (tom, público, dress code, observações)

## 2. Leia a imagem e extraia o design

Use a tool Read na imagem e registre:
- **Paleta**: 4–8 cores hex dominantes (fundo, texto, 1–2 acentos)
- **Modo**: claro ou escuro (fundo predominante)
- **Tipografia**: vibe serif/sans, elegante/divertida — mapeie para stacks web-safe
- **Elementos gráficos** que podem virar ornamentos flutuantes (flores, estrelas, formas,
  padrões). Se não houver como recortar, use emojis ou formas CSS (gradientes/blur) no estilo da arte
- **Mood** em 1 frase (guia as copies)

## 3. Preencha o contrato

Siga o formato de [CONTRACT.md](CONTRACT.md) — é o mesmo shape das colunas `templates.tokens`,
`templates.layout` e `events.content` do banco. Campos que o motor consome:

- `layout.themeClass`: `theme-<slug>` (classe raiz do tema)
- `layout.cssFile`: `/themes/<slug>.css` (o motor injeta o `<link>` sozinho)
- `layout.heroImage`: caminho da arte em `/assets/<slug>/...`
- `layout.logo`: `{type:'text', text, className, taglineClass}` ou `{type:'image', image, className, taglineClass}`
  (em `type:'text'`, dígitos no final do texto ganham `<span>` automático — estilize no CSS)
- `layout.ornaments`: array `[{kind:'emoji'|'image'|'div', value?, className, parallax?}]` —
  o motor renderiza no hero; `parallax` (ex.: `0.08`, `-0.05`) ativa o efeito no scroll
- `layout.primaryButton` / `layout.submitButton`: classe de botão (use `btn-primary`, `btn-dark`,
  `btn-blue` ou uma classe própria definida no seu CSS)
- `tokens.colors/fonts/radius`: viram CSS variables `--tpl-<nome>` no `<main>` — use-as no seu CSS
- `content.copy`: `{eyebrow, headingDescricao, headingDress, celebracao, footer}` — escreva no mood da arte

## 4. Gere os arquivos

1. **`assets/<slug>/`** — copie a arte original para lá (ex.: `arte.jpeg`).
2. **`themes/<slug>.css`** — tema escopado. TODAS as regras começam com `.theme-<slug>`.
   **NÃO crie pasta física para o evento**: as rotas resolvem pela função Vercel
   (`api/invite.js`), que também injeta o título/descrição de compartilhamento (WhatsApp/OG)
   a partir de `content.meta` do evento.

### Checklist obrigatório do CSS (características do layout base)

- [ ] Fundo e cor de texto do tema (use `var(--tpl-*)`)
- [ ] `.hero-overlay` com gradiente que garanta contraste do texto sobre a arte
- [ ] **≥2 ornamentos flutuantes** com `@keyframes` próprios (float suave 6–14s, ease-in-out,
      infinite alternate) — posicionados `position:absolute` dentro do hero, `pointer-events:none`
- [ ] Estilo das classes de botão declaradas em `layout` (pill 999px já vem do base)
- [ ] `.count-box`/`.count-number` do contador no estilo do tema
- [ ] `.detail-card`, `.dress-panel`, `.form-card` e `.event-footer` tematizados
- [ ] Legibilidade: contraste AA em textos sobre fundos/imagens
- [ ] Nada de sobrescrever animações globais (`fade-up`, parallax e `prefers-reduced-motion`
      já são tratados pelo motor/styles.css)

Use como referência os temas existentes em [styles.css](../../../styles.css)
(`.theme-sabado` linha ~173, `.theme-domingo` linha ~195).

## 5. Registre no Supabase (projeto `gklsynhauoffnncmhiwc`)

Via MCP `execute_sql` (dados) — evento nasce **rascunho**:

```sql
with tpl as (
  insert into public.templates (slug, name, description, tokens, layout)
  values ('<slug>', '<nome do tema>', '<descrição curta>', '<tokens>'::jsonb, '<layout>'::jsonb)
  returning id
)
insert into public.events (slug, status, name, starts_at, template_id, max_companions, collect_dietary, content)
select '<slug>', 'draft', '<nome>', '<YYYY-MM-DD HH:MM-03>'::timestamptz, tpl.id, 5, <true|false>, '<content>'::jsonb
from tpl;
```

## 6. Verifique no preview

1. `preview_start` (config `dev`, porta 5173).
2. Rascunho é invisível ao público: publique temporariamente
   (`update public.events set status='published' where slug='<slug>'`), abra `/<slug>/`,
   confira: tema aplicado, ornamentos animando, contador, formulário, console sem erros,
   responsivo (375px sem overflow horizontal).
3. **Volte para `status='draft'`** ao terminar.

## 7. Entregue

Informe ao usuário: o link `/<slug>/`, que o evento está como rascunho, e que para publicar
basta ligar o toggle **"Evento publicado"** no painel `/admin/` (ou pedir aqui). Se o usuário
quiser ajustes de cor/copy, edite o CSS/banco e mostre de novo.
