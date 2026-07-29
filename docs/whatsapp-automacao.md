# Automação de WhatsApp — estudo de opções (decisão pendente)

**Status:** só estudo, nada implementado (decisão de 2026-07-28).
**Casos de uso escolhidos:** (1) confirmação automática para o convidado após o RSVP; (2) aviso ao organizador a cada confirmação. Lembretes em massa ficaram de fora por ora.

## Opções

### 1. WhatsApp Business Platform — Cloud API oficial (Meta)
- **Como:** Edge Function chama a Graph API (`/v*/{phone_number_id}/messages`).
- **Prós:** legal/sustentável, sem risco de ban; caminho correto para a Hive como produto.
- **Contras:** conta Meta Business **verificada**, número **dedicado** (não pode ser usado no app normal), mensagens iniciadas pela empresa exigem **templates aprovados** pela Meta; setup leva dias.
- **Custo:** por conversa (utility ≈ centavos); respostas dentro da janela de 24h do usuário são gratuitas. Confirmação pós-RSVP se qualifica como *utility template*.

### 2. Oficial via intermediário (Twilio, Zenvia, 360dialog, Gupshup)
- Mesma Cloud API por baixo; onboarding mais rápido, sandbox de teste em minutos (Twilio).
- Taxa do intermediário por mensagem em cima do custo Meta. Templates continuam obrigatórios.

### 3. Não-oficial (Z-API, Evolution API, Baileys, whatsapp-web.js)
- Conecta número comum via QR Code (protocolo do WhatsApp Web); envia qualquer texto por REST.
- **Prós:** sem burocracia, funciona em ~1h; Z-API (~R$100/mês, SaaS BR); Evolution API é open source (self-host, ~US$5/mês de VPS).
- **Contras:** **viola os ToS do WhatsApp → risco real de banimento do número**. Se usar, número dedicado/descartável, nunca o principal. Não serve de base para produto sério.

### 4. Click-to-chat (estado atual do site)
- Link `wa.me` pré-preenchido no card de sucesso — o convidado é quem envia. Zero custo/risco, zero automação.

## Arquitetura futura (compatível com o stack atual)

```
INSERT em public.rsvps
  → Database Webhook (Supabase) 
  → Edge Function `notify-rsvp`
      ├─ envia confirmação ao convidado (phone_digits já existe na tabela)
      ├─ envia aviso ao organizador (número em secret/config)
      └─ grava log em `message_logs` (status, provider_id, erro)
```

- Secrets do provedor via `supabase secrets set` (mesmo padrão planejado para a `generate-invite`).
- Tabela `message_logs` (a criar): rsvp_id, tipo (guest_confirm | organizer_alert), provider, status, payload, created_at.
- O template de mensagem pode viver em `events.content.whatsapp` (já existe `mensagemTemplate`).

## Recomendação registrada

- **F70 (evento único):** rota não-oficial resolve rápido e barato, com chip dedicado — risco aceitável para um evento.
- **Hive (produto):** Cloud API oficial é a única rota sustentável; iniciar a verificação do Meta Business cedo (é o gargalo de prazo).
