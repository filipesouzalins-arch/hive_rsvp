with tpl as (
  insert into public.templates (slug, name, description, tokens, layout) values
  ('f70-noite', 'F70 — Noite', 'Tema escuro: preto, prata e cromo para festa noturna',
   '{"colors":{"ink":"#0a0a0a","paper":"#f7f3e8","silver":"#c9ccd1","accent":"#ffffff"},
     "fonts":{"serif":"Georgia, ''Times New Roman'', serif","sans":"Inter, system-ui, sans-serif"},
     "radius":"28px"}'::jsonb,
   '{"themeClass":"theme-sabado","mode":"dark","ornaments":"chrome-orbs","primaryButton":"btn-primary","submitButton":"btn-dark"}'::jsonb),
  ('feijuca-dia', 'Feijuca — Dia', 'Tema claro: azul, verde e orgânico para feijoada de domingo',
   '{"colors":{"ink":"#0a0a0a","paper":"#f7f3e8","blue":"#163f9c","navy":"#0b2c6b","lime":"#a8c52c","leaf":"#4e7b2a"},
     "fonts":{"serif":"Georgia, ''Times New Roman'', serif","sans":"Inter, system-ui, sans-serif"},
     "radius":"28px"}'::jsonb,
   '{"themeClass":"theme-domingo","mode":"light","ornaments":"leaves","primaryButton":"btn-blue","submitButton":"btn-blue"}'::jsonb)
  returning id, slug
)
insert into public.events (slug, status, name, starts_at, template_id, max_companions, collect_dietary, content)
select v.slug, 'published', v.name, v.starts_at,
       (select id from tpl where tpl.slug = v.tpl_slug), 5, v.collect_dietary, v.content
from (values
  ('sabado', 'F70', '2026-08-08 21:00:00-03'::timestamptz, 'f70-noite', false,
   '{"tagline":"Uma noite criada para celebrar histórias, encontros e tudo o que ainda está por vir.",
     "descricao":"O França completa 70 anos e queremos celebrar essa história em uma noite inesquecível. Música, encontros especiais e uma pista preparada para atravessar a madrugada.",
     "dressCode":"Preto, branco ou prata. Uma produção elegante, contemporânea e pronta para a pista.",
     "local":{"nome":"Chácara do França","endereco":"Endereço enviado aos convidados",
              "mapsUrl":"https://www.google.com/maps?q=Indaiatuba%2C%20SP&output=embed",
              "directionsUrl":"https://www.google.com/maps/search/?api=1&query=Indaiatuba%2C%20SP"},
     "whatsapp":{"numero":"5511999999999","habilitado":true,
                 "mensagemTemplate":"Olá! Aqui é {nome}. Confirmo minha presença no evento {evento}, com {acompanhantes} acompanhante(s)."},
     "secoes":{"mapa":true,"dressCode":true,"contador":true,"descricao":true},
     "meta":{"title":"F70 — Celebração de 70 anos do França",
             "description":"Uma noite especial para celebrar os 70 anos do França.","themeColor":"#0a0a0a"}}'::jsonb),
  ('domingo', 'Feijuca do França', '2026-08-09 12:00:00-03'::timestamptz, 'feijuca-dia', true,
   '{"tagline":"Feijoada, pagode e bons encontros para continuar celebrando.",
     "descricao":"No domingo, a celebração continua do jeito que o França gosta: mesa cheia, samba de raiz, família, amigos e aquela energia gostosa de um encontro que fica na memória.",
     "dressCode":"Branco. Leve, fresco e perfeito para um domingo de feijoada e pagode.",
     "local":{"nome":"Chácara do França","endereco":"Endereço enviado aos convidados",
              "mapsUrl":"https://www.google.com/maps?q=Indaiatuba%2C%20SP&output=embed",
              "directionsUrl":"https://www.google.com/maps/search/?api=1&query=Indaiatuba%2C%20SP"},
     "whatsapp":{"numero":"5511999999999","habilitado":true,
                 "mensagemTemplate":"Olá! Aqui é {nome}. Confirmo minha presença na {evento}, com {acompanhantes} acompanhante(s)."},
     "secoes":{"mapa":true,"dressCode":true,"contador":true,"descricao":true},
     "meta":{"title":"Feijuca do França — Celebração de 70 anos",
             "description":"Feijoada, pagode e bons encontros para celebrar os 70 anos do França.","themeColor":"#f7f3e8"}}'::jsonb)
) as v(slug, name, starts_at, tpl_slug, collect_dietary, content);
