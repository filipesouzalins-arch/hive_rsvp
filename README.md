# Hive RSVP — França 70

Site de convites com confirmação de presença (RSVP), conectado ao Supabase. Cada evento tem seu próprio link e formulário:

- `/sabado/` — F70
- `/domingo/` — Feijuca do França
- `/admin/` — painel administrativo
- `/<slug>` — qualquer evento novo criado no banco funciona pelo slug (fallback SPA)

## Backend (Supabase)

Projeto: **Hive_RSVP** (`gklsynhauoffnncmhiwc`). As migrations aplicadas estão espelhadas em `supabase/migrations/`.

Tabelas:

- `events` — eventos publicáveis por slug; copy e apresentação no jsonb `content`
- `rsvps` — confirmações (nunca legíveis pelo público; insert anônimo com validação por trigger e dedupe por telefone)
- `templates` — temas reutilizáveis (tokens/layout); base para a futura geração por IA
- `invite_generations` — registro das futuras gerações de template por IA (upload → contexto → resposta estruturada)

Storage: bucket público `event-assets` (imagens dos convites) e privado `invite-uploads` (uploads para IA).

## Painel administrativo

Login via Supabase Auth (e-mail/senha). O usuário admin é criado no Dashboard do Supabase
(Authentication → Users → Add user, com Auto Confirm). Importante: manter **"Allow new users to sign up" desligado** —
qualquer usuário autenticado tem acesso total ao painel.

## Como visualizar localmente

```bash
npx serve --single -l 5173 .
```

Depois abra `http://localhost:5173`. O `--single` reproduz o fallback SPA do Netlify.

## Publicação

A pasta pode ser publicada diretamente no Netlify. O `netlify.toml` já inclui o fallback `/*` → `/index.html`,
que também atende os links de eventos criados só no banco (sem pasta física).

## Próximas fases

- Edge Function `generate-invite`: upload da arte do convite → OpenAI (contexto compacto + structured output) → template
- Tema dinâmico lido de `templates.tokens` como CSS variables
- Multi-tenant (coluna `owner_id` já existe)
