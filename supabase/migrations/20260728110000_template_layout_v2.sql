-- Layout v2: renderização genérica dirigida pelo template (logo, ornamentos, hero, botões)
update public.templates set layout = '{
  "themeClass": "theme-sabado",
  "mode": "dark",
  "cssFile": null,
  "heroImage": "/assets/sabado-sala.jpeg",
  "logo": {"type": "text", "text": "F70", "className": "f70-mark", "taglineClass": "f70-tagline"},
  "ornaments": [
    {"kind": "div", "className": "wire-lines"},
    {"kind": "div", "className": "orb chrome", "parallax": 0.08},
    {"kind": "div", "className": "orb check", "parallax": -0.05}
  ],
  "primaryButton": "btn-primary",
  "submitButton": "btn-dark"
}'::jsonb where slug = 'f70-noite';

update public.templates set layout = '{
  "themeClass": "theme-domingo",
  "mode": "light",
  "cssFile": null,
  "heroImage": "/assets/domingo-pattern-organico.jpeg",
  "logo": {"type": "image", "image": "/assets/domingo-logo.jpeg", "className": "feijuca-logo", "taglineClass": "lead hero-tagline-center"},
  "ornaments": [
    {"kind": "emoji", "value": "🌿", "className": "leaf-float leaf-a"},
    {"kind": "emoji", "value": "🌴", "className": "leaf-float leaf-b"}
  ],
  "primaryButton": "btn-blue",
  "submitButton": "btn-blue"
}'::jsonb where slug = 'feijuca-dia';

-- Copies que antes eram hardcoded no paintEvent
update public.events set content = jsonb_set(content, '{copy}', '{
  "eyebrow": "70 anos do França",
  "headingDescricao": "Uma noite à altura dessa história.",
  "headingDress": "Entre no clima da noite.",
  "celebracao": "Balada F70",
  "footer": "Esperamos você para celebrar os 70 anos do França e transformar esses dois dias em uma memória inesquecível."
}'::jsonb) where slug = 'sabado';

update public.events set content = jsonb_set(content, '{copy}', '{
  "eyebrow": "70 anos do França",
  "headingDescricao": "Um domingo com o melhor do Brasil.",
  "headingDress": "Todo mundo de branco.",
  "celebracao": "Feijoada e pagode",
  "footer": "Esperamos você para celebrar os 70 anos do França e transformar esses dois dias em uma memória inesquecível."
}'::jsonb) where slug = 'domingo';
