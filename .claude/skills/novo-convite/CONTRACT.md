# Contrato de geração de template de convite (IA)

Contrato compacto para gerar um template de convite a partir de uma imagem. Usado pela skill
`/novo-convite` e, no futuro, pela Edge Function `generate-invite` (OpenAI structured output —
a resposta é armazenada em `invite_generations.response`). Projetado para economia de tokens:
envie APENAS o bloco CONTEXTO + a imagem + os DADOS DO EVENTO; exija a resposta no JSON abaixo.

## CONTEXTO (enviar à IA)

> Você gera temas para um site de convites com estrutura fixa: hero (imagem de fundo + overlay +
> logo + tagline + contador regressivo + botão), seções "descrição", "dress code", "local/mapa",
> formulário RSVP e rodapé. A estrutura NÃO muda; você define identidade visual e textos.
> Analise a imagem do convite e responda SOMENTE o JSON do formato combinado, sem markdown.
> Cores em hex. Fontes: apenas stacks web-safe (Georgia/serif, Inter/system-ui etc.).
> Ornaments são elementos decorativos que flutuam sobre o hero (emoji ou formas CSS).
> Textos em pt-BR, no tom/mood da arte. themeClass = "theme-" + slug.

## ENTRADA

- Imagem da arte do convite (visão)
- Dados do evento: `{slug, nome, dataHora, local: {nome, endereco}, whatsappNumero, briefing?}`

## SAÍDA — JSON Schema (response_format da OpenAI / shape de invite_generations.response)

```json
{
  "type": "object",
  "required": ["template", "event"],
  "properties": {
    "template": {
      "type": "object",
      "required": ["slug", "name", "tokens", "layout"],
      "properties": {
        "slug": { "type": "string", "pattern": "^[a-z0-9][a-z0-9-]{1,58}$" },
        "name": { "type": "string" },
        "description": { "type": "string" },
        "tokens": {
          "type": "object",
          "properties": {
            "colors": { "type": "object", "additionalProperties": { "type": "string" } },
            "fonts": { "type": "object", "properties": { "serif": {"type":"string"}, "sans": {"type":"string"} } },
            "radius": { "type": "string" }
          }
        },
        "layout": {
          "type": "object",
          "required": ["themeClass", "mode", "heroImage", "logo", "ornaments", "primaryButton", "submitButton"],
          "properties": {
            "themeClass": { "type": "string" },
            "mode": { "enum": ["light", "dark"] },
            "cssFile": { "type": ["string", "null"] },
            "heroImage": { "type": "string" },
            "logo": {
              "type": "object",
              "required": ["type"],
              "properties": {
                "type": { "enum": ["text", "image"] },
                "text": { "type": "string" },
                "image": { "type": "string" },
                "className": { "type": "string" },
                "taglineClass": { "type": "string" }
              }
            },
            "ornaments": {
              "type": "array",
              "minItems": 2,
              "items": {
                "type": "object",
                "required": ["kind", "className"],
                "properties": {
                  "kind": { "enum": ["emoji", "image", "div"] },
                  "value": { "type": "string" },
                  "className": { "type": "string" },
                  "parallax": { "type": "number" }
                }
              }
            },
            "primaryButton": { "type": "string" },
            "submitButton": { "type": "string" }
          }
        }
      }
    },
    "event": {
      "type": "object",
      "required": ["slug", "name", "content"],
      "properties": {
        "slug": { "type": "string" },
        "name": { "type": "string" },
        "starts_at": { "type": "string", "description": "ISO com fuso, ex. 2026-12-20T19:00:00-03:00" },
        "max_companions": { "type": "integer", "minimum": 0, "maximum": 20 },
        "collect_dietary": { "type": "boolean" },
        "content": {
          "type": "object",
          "properties": {
            "tagline": { "type": "string" },
            "descricao": { "type": "string" },
            "dressCode": { "type": "string" },
            "local": { "type": "object" },
            "whatsapp": { "type": "object" },
            "secoes": { "type": "object" },
            "meta": {
              "type": "object",
              "properties": { "title": {"type":"string"}, "description": {"type":"string"}, "themeColor": {"type":"string"} }
            },
            "copy": {
              "type": "object",
              "properties": {
                "eyebrow": { "type": "string" },
                "headingDescricao": { "type": "string" },
                "headingDress": { "type": "string" },
                "celebracao": { "type": "string" },
                "footer": { "type": "string" }
              }
            }
          }
        }
      }
    },
    "themeCss": {
      "type": "string",
      "description": "Opcional: CSS completo do tema, escopado em .theme-<slug>. A skill do Claude Code gera o CSS por conta própria; a Edge Function pode pedir este campo."
    }
  }
}
```

## Notas de implementação

- O motor ([app.js](../../../app.js)) consome `layout` e injeta `tokens` como CSS variables
  `--tpl-<nome>` no `<main>`; `layout.cssFile` é carregado dinamicamente.
- `invite_generations`: gravar `prompt_context` (o bloco CONTEXTO + dados do evento) e
  `response` (o JSON acima) para auditoria e reuso.
- Custo de tokens: o CONTEXTO tem ~120 palavras; com structured output, a resposta é
  determinística e sem prosa.
