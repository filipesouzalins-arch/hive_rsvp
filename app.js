import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://gklsynhauoffnncmhiwc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0W_0v0W_u9HPOxUQlLG1Xg_X-5KMXis';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const app = document.getElementById('app');
const route = window.__ROUTE__ || detectRoute();
let countdownTimer = null;

function detectRoute() {
  const pathname = location.pathname.replace(/\/+$/, '');
  const segment = pathname.split('/').pop();
  if (!segment) return 'home';
  if (segment === 'admin') return 'admin';
  return segment;
}

// Converte a linha do banco para o formato que as funções de render já usam.
function toClientEvent(row) {
  const content = row.content || {};
  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    nome: row.name,
    dataHora: row.starts_at,
    maxAcompanhantes: Number(row.max_companions ?? 5),
    coletaRestricao: !!row.collect_dietary,
    tagline: content.tagline || '',
    descricao: content.descricao || '',
    dressCode: content.dressCode || '',
    local: content.local || { nome: '', endereco: '', mapsUrl: '', directionsUrl: '' },
    whatsapp: content.whatsapp || { numero: '', habilitado: false, mensagemTemplate: '' },
    secoes: content.secoes || { mapa: true, dressCode: true, contador: true, descricao: true },
    meta: content.meta || null,
    copy: content.copy || {},
    template: row.templates
      ? { tokens: row.templates.tokens || {}, layout: row.templates.layout || {} }
      : { tokens: {}, layout: {} },
    templateId: row.template_id || null,
    content
  };
}

function toClientRsvp(row) {
  return {
    id: row.id,
    nome: row.full_name,
    telefone: row.phone,
    acompanhantes: Number(row.companions || 0),
    restricaoAlimentar: row.dietary || '',
    observacoes: row.notes || '',
    criadoEm: row.created_at
  };
}

const dataService = {
  async getEvent(slug) {
    const { data, error } = await supabase.from('events').select('*, templates(*)').eq('slug', slug).maybeSingle();
    if (error) throw error;
    return data ? toClientEvent(data) : null;
  },
  async listEvents() {
    const { data, error } = await supabase.from('events').select('*, templates(*)').order('starts_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(toClientEvent);
  },
  async updateEvent(eventId, row) {
    const { error } = await supabase.from('events').update(row).eq('id', eventId);
    if (error) throw error;
  },
  async addRsvp(event, rsvp) {
    const { error } = await supabase.from('rsvps').insert({
      event_id: event.id,
      full_name: rsvp.nome,
      phone: rsvp.telefone,
      companions: rsvp.acompanhantes,
      dietary: rsvp.restricaoAlimentar || null,
      notes: rsvp.observacoes || null
    });
    if (error) throw error;
    return rsvp;
  },
  async getRsvps(eventId) {
    const { data, error } = await supabase.from('rsvps').select('*')
      .eq('event_id', eventId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(toClientRsvp);
  },
  async deleteRsvp(rsvpId) {
    const { error } = await supabase.from('rsvps').delete().eq('id', rsvpId);
    if (error) throw error;
  },
  subscribe(slug, callback) {
    const channel = supabase
      .channel(`event-${slug}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'events', filter: `slug=eq.${slug}` },
        payload => callback(toClientEvent(payload.new)))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }
};

function esc(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDateLong(iso) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  }).format(date);
}

function formatTime(iso) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

function capitalize(text) { return text ? text.charAt(0).toUpperCase() + text.slice(1) : ''; }

function toLocalInput(iso) {
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function updateMeta(event) {
  const meta = event.meta || {};
  const title = meta.title || `${event.nome} — Convite`;
  const description = meta.description || event.tagline || '';
  document.title = title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', meta.themeColor || '#0a0a0a');
}

function renderHome() {
  document.title = 'França 70 — Dois dias para celebrar';
  app.innerHTML = `
    <main class="home">
      <div class="shell">
        <header class="home-top">
          <div>
            <div class="home-mark">França 70</div>
            <div class="home-kicker">08 & 09 de agosto de 2026</div>
          </div>
          <a class="btn btn-outline" href="./admin/" aria-label="Abrir painel administrativo">Área reservada</a>
        </header>

        <section class="home-intro fade-up visible">
          <h1 class="home-title">Uma história.<br><em>Dois dias</em><br>para celebrar.</h1>
          <p class="home-copy">Escolha o convite do evento que você recebeu, confira todos os detalhes e confirme sua presença. Estamos preparando dois encontros muito especiais.</p>
        </section>

        <section class="event-grid" aria-label="Escolha o evento">
          <a href="./sabado/" class="event-card fade-up visible" aria-label="Abrir convite de sábado F70">
            <img class="event-card-bg" src="./assets/sabado-sala.jpeg" alt="Ambiente preto e branco da festa F70" />
            <span class="card-number">01</span>
            <div class="event-card-content">
              <div class="card-day">Sábado · 08 de agosto</div>
              <h2 class="card-title">F70</h2>
              <div class="card-meta"><span>21h</span><span>Balada · Preto, branco e prata</span></div>
              <div class="card-action">Ver convite <span>→</span></div>
            </div>
          </a>

          <a href="./domingo/" class="event-card fade-up visible" aria-label="Abrir convite de domingo Feijuca do França">
            <img class="event-card-bg" src="./assets/domingo-logo.jpeg" alt="Identidade visual da Feijuca do França" />
            <span class="card-number">02</span>
            <div class="event-card-content">
              <div class="card-day">Domingo · 09 de agosto</div>
              <h2 class="card-title">Feijuca<br>do França</h2>
              <div class="card-meta"><span>12h</span><span>Feijoada · Pagode · Dress code branco</span></div>
              <div class="card-action">Ver convite <span>→</span></div>
            </div>
          </a>
        </section>

        <footer class="home-footer">
          <span>Uma celebração pensada nos detalhes.</span>
          <span>Confirmações individuais para cada dia.</span>
        </footer>
      </div>
    </main>`;
}

function renderNotFound() {
  document.title = 'Convite não encontrado';
  app.innerHTML = `
    <main class="home">
      <div class="shell">
        <section class="home-intro fade-up visible" style="min-height:70vh;display:flex;flex-direction:column;justify-content:center;gap:22px">
          <h1 class="home-title">Convite não<br><em>encontrado</em>.</h1>
          <p class="home-copy">Confira o link que você recebeu ou fale com quem enviou o convite.</p>
          <div><a class="btn btn-outline" href="/">← Página inicial</a></div>
        </section>
      </div>
    </main>`;
}

function renderLoadError() {
  document.title = 'Erro ao carregar';
  app.innerHTML = `
    <main class="home">
      <div class="shell">
        <section class="home-intro fade-up visible" style="min-height:70vh;display:flex;flex-direction:column;justify-content:center;gap:22px">
          <h1 class="home-title">Não foi possível<br><em>carregar</em> o convite.</h1>
          <p class="home-copy">Verifique sua conexão e tente novamente em instantes.</p>
          <div><a class="btn btn-outline" href="javascript:location.reload()">Tentar novamente</a></div>
        </section>
      </div>
    </main>`;
}

async function renderEvent(slug) {
  let event;
  try {
    event = await dataService.getEvent(slug);
  } catch (err) {
    console.error(err);
    return renderLoadError();
  }
  if (!event) return renderNotFound();
  updateMeta(event);
  paintEvent(event);
  let current = event;
  dataService.subscribe(slug, async next => {
    // O payload do realtime não traz o join com templates: preserva o carregado
    // (ou refetch se o template do evento mudou).
    if (next.templateId !== current.templateId) {
      try { next = await dataService.getEvent(slug) || next; } catch { /* mantém o payload */ }
    } else {
      next = { ...next, template: current.template };
    }
    current = next;
    const scroll = window.scrollY;
    updateMeta(next);
    paintEvent(next);
    window.scrollTo(0, scroll);
  });
}

const themeCssLoaded = new Set();
function ensureThemeCss(cssFile) {
  if (!cssFile || themeCssLoaded.has(cssFile)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = cssFile;
  document.head.appendChild(link);
  themeCssLoaded.add(cssFile);
}

function tokenStyleVars(tokens) {
  const vars = [];
  Object.entries(tokens.colors || {}).forEach(([name, value]) => vars.push(`--tpl-${name}:${value}`));
  if (tokens.fonts?.serif) vars.push(`--tpl-serif:${tokens.fonts.serif}`);
  if (tokens.fonts?.sans) vars.push(`--tpl-sans:${tokens.fonts.sans}`);
  if (tokens.radius) vars.push(`--tpl-radius:${tokens.radius}`);
  return vars.join(';');
}

function logoMarkup(logo, event) {
  const tagline = event.tagline
    ? `<p class="${esc(logo?.taglineClass || 'f70-tagline')}">${esc(event.tagline)}</p>`
    : '';
  if (logo?.type === 'image' && logo.image) {
    return `<img class="${esc(logo.className || 'feijuca-logo')}" src="${esc(logo.image)}" alt="${esc(event.nome)}" />${tagline}`;
  }
  const text = logo?.text || event.nome;
  const marked = esc(text).replace(/(\d+)\s*$/, '<span>$1</span>');
  return `<h1 class="${esc(logo?.className || 'f70-mark')}">${marked}</h1>${tagline}`;
}

function ornamentsMarkup(list) {
  if (!Array.isArray(list)) return '';
  return list.map(o => {
    const parallax = typeof o.parallax === 'number' ? ` data-parallax="${o.parallax}"` : '';
    const cls = esc(o.className || '');
    if (o.kind === 'image' && o.value) return `<img class="${cls}" src="${esc(o.value)}" alt=""${parallax} />`;
    if (o.kind === 'emoji') return `<div class="${cls}" aria-hidden="true"${parallax}>${esc(o.value || '')}</div>`;
    return `<div class="${cls}" aria-hidden="true"${parallax}></div>`;
  }).join('');
}

function paintEvent(event) {
  const layout = event.template.layout || {};
  const theme = layout.themeClass || 'theme-domingo';
  ensureThemeCss(layout.cssFile);
  const tokenStyle = tokenStyleVars(event.template.tokens || {});
  const btnPrimary = layout.primaryButton || 'btn-blue';
  const heroImage = 'heroImage' in layout ? layout.heroImage : '/assets/domingo-pattern-organico.jpeg';
  const copy = event.copy || {};
  const eyebrow = copy.eyebrow || '';
  const rootPrefix = '/';
  const dateLabel = capitalize(formatDateLong(event.dataHora));
  const logo = logoMarkup(layout.logo, event);
  const ornaments = ornamentsMarkup(layout.ornaments);

  app.innerHTML = `
    <main class="event-page ${theme}"${tokenStyle ? ` style="${esc(tokenStyle)}"` : ''}>
      <nav class="event-nav">
        <a class="event-nav-brand" href="${rootPrefix}">${esc(event.nome)}</a>
        <div class="event-nav-links">
          <a href="#detalhes">Detalhes</a>
          ${event.secoes.dressCode ? '<a href="#dresscode">Dress code</a>' : ''}
          ${event.secoes.mapa ? '<a href="#local">Local</a>' : ''}
          <a class="rsvp-nav" href="#confirmar">Confirmar presença</a>
        </div>
      </nav>

      <section class="hero">
        ${heroImage ? `<img class="hero-bg" src="${esc(heroImage)}" alt="" />` : ''}
        <div class="hero-overlay"></div>
        ${ornaments}
        <div class="hero-content">
          ${eyebrow ? `<div class="eyebrow">${esc(eyebrow)}</div>` : ''}
          ${logo}
          <div class="hero-date">${esc(dateLabel)} · ${esc(formatTime(event.dataHora))}</div>
          ${event.secoes.contador ? countdownMarkup(event.dataHora) : ''}
          <div class="hero-actions">
            <a class="btn ${btnPrimary}" href="#confirmar">Confirmar presença</a>
            <a class="btn btn-outline" href="#detalhes">Ver detalhes</a>
          </div>
        </div>
        <div class="scroll-cue">Descubra</div>
      </section>

      ${event.secoes.descricao ? `
      <section class="section" id="detalhes">
        <div class="shell details-grid">
          <div class="fade-up">
            <span class="eyebrow">O encontro</span>
            <h2 class="section-heading">${esc(copy.headingDescricao || 'Um encontro preparado com carinho.')}</h2>
            <p class="lead">${esc(event.descricao)}</p>
          </div>
          <div class="detail-stack fade-up">
            <article class="detail-card"><span class="detail-label">Data</span><div class="detail-value">${esc(dateLabel)}</div></article>
            <article class="detail-card"><span class="detail-label">Horário</span><div class="detail-value">A partir das ${esc(formatTime(event.dataHora))}</div></article>
            <article class="detail-card"><span class="detail-label">Celebração</span><div class="detail-value">${esc(copy.celebracao || event.nome)}</div></article>
          </div>
        </div>
      </section>` : `<div id="detalhes"></div>`}

      ${event.secoes.dressCode ? `
      <section class="section alt" id="dresscode">
        <div class="shell">
          <div class="dress-panel fade-up">
            <span class="eyebrow">Dress code</span>
            <h3>${esc(copy.headingDress || 'Entre no clima.')}</h3>
            <p>${esc(event.dressCode)}</p>
          </div>
        </div>
      </section>` : ''}

      ${event.secoes.mapa ? `
      <section class="section" id="local">
        <div class="shell details-grid">
          <div class="fade-up">
            <span class="eyebrow">Onde será</span>
            <h2 class="section-heading">O caminho para a celebração.</h2>
            <p class="lead"><strong>${esc(event.local.nome)}</strong><br>${esc(event.local.endereco)}</p>
            <div class="hero-actions"><a class="btn ${btnPrimary}" href="${esc(event.local.directionsUrl || event.local.mapsUrl)}" target="_blank" rel="noopener">Como chegar ↗</a></div>
          </div>
          <div class="map-wrap fade-up">
            <iframe title="Mapa do evento" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${esc(event.local.mapsUrl)}"></iframe>
            <div class="map-floating">
              <div><strong>${esc(event.local.nome)}</strong><small>${esc(event.local.endereco)}</small></div>
              <a class="btn btn-dark" href="${esc(event.local.directionsUrl || event.local.mapsUrl)}" target="_blank" rel="noopener">Abrir mapa</a>
            </div>
          </div>
        </div>
      </section>` : ''}

      <section class="section alt" id="confirmar">
        <div class="shell rsvp-layout">
          <div class="fade-up">
            <span class="eyebrow">RSVP</span>
            <h2 class="section-heading">Sua presença faz parte da festa.</h2>
            <p class="lead">Confirme abaixo para que possamos preparar tudo com carinho. A confirmação é válida apenas para este dia.</p>
          </div>
          <div id="rsvp-container" class="fade-up">${rsvpFormMarkup(event)}</div>
        </div>
      </section>

      <footer class="event-footer">
        <div class="shell footer-inner">
          <div><div class="footer-name">${esc(event.nome)}</div><div>${esc(dateLabel)} · ${esc(formatTime(event.dataHora))}</div></div>
          <div class="footer-copy">${esc(copy.footer || 'Esperamos você para celebrar conosco.')}</div>
        </div>
      </footer>
    </main>`;

  initCountdown(event.dataHora);
  initReveal();
  initParallax();
  initRsvpForm(event);
}

function countdownMarkup(iso) {
  return `<div class="countdown-grid" data-countdown="${esc(iso)}">
    ${['Dias','Horas','Minutos','Segundos'].map((label, i) => `<div class="count-box"><span class="count-number" data-count="${i}">00</span><span class="count-label">${label}</span></div>`).join('')}
  </div>`;
}

function initCountdown(iso) {
  const root = document.querySelector('[data-countdown]');
  if (!root) return;
  const numbers = [...root.querySelectorAll('[data-count]')];
  let last = [];
  if (countdownTimer) clearInterval(countdownTimer);
  const tick = () => {
    const diff = Math.max(0, new Date(iso).getTime() - Date.now());
    const values = [
      Math.floor(diff / 86400000),
      Math.floor((diff / 3600000) % 24),
      Math.floor((diff / 60000) % 60),
      Math.floor((diff / 1000) % 60)
    ];
    values.forEach((value, index) => {
      const next = String(value).padStart(2, '0');
      if (last[index] !== next) {
        numbers[index].textContent = next;
        numbers[index].classList.remove('tick');
        void numbers[index].offsetWidth;
        numbers[index].classList.add('tick');
      }
    });
    last = values.map(v => String(v).padStart(2, '0'));
    if (diff <= 0) {
      root.innerHTML = '<div class="count-box" style="grid-column:1/-1"><span class="count-number">É hoje!</span><span class="count-label">Vamos celebrar</span></div>';
      if (countdownTimer) clearInterval(countdownTimer);
    }
  };
  tick();
  countdownTimer = setInterval(tick, 1000);
}

function initReveal() {
  const items = document.querySelectorAll('.fade-up');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .1 });
  items.forEach(item => observer.observe(item));
}

function initParallax() {
  const items = [...document.querySelectorAll('[data-parallax]')];
  if (!items.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let raf;
  const update = () => {
    const y = window.scrollY;
    items.forEach(item => {
      const speed = Number(item.dataset.parallax || 0);
      item.style.translate = `0 ${y * speed}px`;
    });
    raf = null;
  };
  window.addEventListener('scroll', () => {
    if (!raf) raf = requestAnimationFrame(update);
  }, { passive: true });
}

function rsvpFormMarkup(event) {
  const layout = event.template?.layout || {};
  const btnSubmit = layout.submitButton || layout.primaryButton || 'btn-blue';
  const companionOptions = Array.from({ length: event.maxAcompanhantes + 1 }, (_, n) => `<option value="${n}">${n}</option>`).join('');
  return `<div class="form-card">
    <form id="rsvp-form" novalidate>
      <div class="form-grid">
        <div class="field full"><label for="nome">Nome completo</label><input id="nome" name="nome" autocomplete="name" maxlength="120" placeholder="Como devemos registrar você?" /><span class="field-error" data-error="nome"></span></div>
        <div class="field"><label for="telefone">WhatsApp</label><input id="telefone" name="telefone" inputmode="tel" autocomplete="tel" placeholder="(11) 99999-9999" maxlength="15" /><span class="field-error" data-error="telefone"></span></div>
        <div class="field"><label for="acompanhantes">Acompanhantes</label><select id="acompanhantes" name="acompanhantes">${companionOptions}</select><span class="field-error"></span></div>
        ${event.coletaRestricao ? '<div class="field full"><label for="restricao">Restrição alimentar <small>(opcional)</small></label><input id="restricao" name="restricaoAlimentar" maxlength="300" placeholder="Ex.: vegetariano, alergia a amendoim..." /></div>' : ''}
        <div class="field full"><label for="observacoes">Observações <small>(opcional)</small></label><textarea id="observacoes" name="observacoes" maxlength="1000" placeholder="Escreva aqui alguma informação importante."></textarea></div>
      </div>
      <div class="form-foot">
        <span class="form-note">Seus dados serão utilizados somente para a organização desta celebração.</span>
        <button class="btn ${btnSubmit}" type="submit">Confirmar presença</button>
      </div>
    </form>
  </div>`;
}

function initRsvpForm(event) {
  const form = document.getElementById('rsvp-form');
  if (!form) return;
  const phone = form.querySelector('#telefone');
  phone.addEventListener('input', () => phone.value = phoneMask(phone.value));
  let submitting = false;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (submitting) return;
    const data = Object.fromEntries(new FormData(form));
    const errors = {};
    if (!String(data.nome || '').trim() || String(data.nome).trim().length < 3) errors.nome = 'Digite seu nome completo.';
    if (digits(data.telefone).length < 10) errors.telefone = 'Digite um WhatsApp válido.';
    form.querySelectorAll('[data-error]').forEach(el => el.textContent = errors[el.dataset.error] || '');
    if (Object.keys(errors).length) return;

    submitting = true;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Confirmando...';
    try {
      const record = await dataService.addRsvp(event, {
        nome: String(data.nome).trim(),
        telefone: String(data.telefone).trim(),
        acompanhantes: Number(data.acompanhantes || 0),
        restricaoAlimentar: String(data.restricaoAlimentar || '').trim(),
        observacoes: String(data.observacoes || '').trim()
      });
      showRsvpSuccess(event, record);
    } catch (err) {
      console.error(err);
      submitting = false;
      button.disabled = false;
      button.textContent = 'Confirmar presença';
      const duplicate = err?.code === '23505';
      toast(duplicate
        ? 'Este WhatsApp já confirmou presença neste evento.'
        : 'Não foi possível registrar sua confirmação. Tente novamente.', true);
    }
  });
}

function showRsvpSuccess(event, record) {
  const container = document.getElementById('rsvp-container');
  const btnPrimary = event.template?.layout?.primaryButton || 'btn-blue';
  const message = (event.whatsapp.mensagemTemplate || '')
    .replaceAll('{nome}', record.nome)
    .replaceAll('{evento}', event.nome)
    .replaceAll('{acompanhantes}', String(record.acompanhantes));
  const waUrl = `https://wa.me/${digits(event.whatsapp.numero)}?text=${encodeURIComponent(message)}`;
  container.innerHTML = `<div class="success-card">
    <div class="success-icon">✓</div>
    <h3>Presença confirmada, ${esc(record.nome.split(' ')[0])}!</h3>
    <p>Registramos sua confirmação para <strong>${esc(event.nome)}</strong>. Agora é só entrar no clima da celebração.</p>
    ${event.whatsapp.habilitado ? `<a class="btn ${btnPrimary}" target="_blank" rel="noopener" href="${waUrl}">Confirmar também pelo WhatsApp</a>` : ''}
  </div>`;
}

function phoneMask(value) {
  const d = digits(value).slice(0, 11);
  if (d.length <= 2) return d.replace(/(\d{0,2})/, '($1');
  if (d.length <= 6) return d.replace(/(\d{2})(\d+)/, '($1) $2');
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
  return d.replace(/(\d{2})(\d{5})(\d+)/, '($1) $2-$3');
}

function digits(value) { return String(value || '').replace(/\D/g, ''); }

async function renderAdmin() {
  document.title = 'Painel RSVP — França 70';
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return renderLogin();
  paintAdmin();
}

function renderLogin(error = '') {
  app.innerHTML = `<main class="admin-login">
    <section class="login-card">
      <span class="eyebrow">Área reservada</span>
      <h1>Painel RSVP</h1>
      <p>Gerencie as informações dos eventos e acompanhe as confirmações.</p>
      <form id="login-form">
        <div class="field"><label for="admin-email">E-mail</label><input id="admin-email" type="email" autocomplete="username" placeholder="voce@exemplo.com" /></div>
        <div class="field" style="margin-top:12px"><label for="admin-password">Senha</label><input id="admin-password" type="password" autocomplete="current-password" placeholder="Digite sua senha" /><span class="field-error">${esc(error)}</span></div>
        <button class="btn btn-primary" style="width:100%;margin-top:18px" type="submit">Entrar no painel</button>
      </form>
      <a href="../" style="display:block;text-align:center;margin-top:20px;color:#9195a0;font-size:.82rem">← Voltar aos convites</a>
    </section>
  </main>`;
  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;
    if (!email || !password) return renderLogin('Preencha e-mail e senha.');
    const button = e.target.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Entrando...';
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return renderLogin('E-mail ou senha incorretos.');
    paintAdmin();
  });
}

async function paintAdmin(activeSlug) {
  let events, event, rsvps;
  try {
    events = await dataService.listEvents();
    if (!events.length) {
      app.innerHTML = '<main class="admin-page"><div class="admin-shell"><div class="empty">Nenhum evento cadastrado.</div></div></main>';
      return;
    }
    event = events.find(item => item.slug === activeSlug) || events[0];
    rsvps = await dataService.getRsvps(event.id);
  } catch (err) {
    console.error(err);
    toast('Não foi possível carregar os dados do painel.', true);
    return;
  }

  const tabs = events.map(item =>
    `<button class="admin-tab ${item.slug === event.slug ? 'active' : ''}" data-tab="${esc(item.slug)}">${esc(item.nome)}${item.status !== 'published' ? ' · rascunho' : ''}</button>`
  ).join('');

  app.innerHTML = `<main class="admin-page">
    <header class="admin-header"><div class="admin-header-inner">
      <div><div class="admin-brand">França 70 · Painel RSVP</div><div style="color:#858995;font-size:.74rem">Dados sincronizados com o Supabase</div></div>
      <div style="display:flex;gap:8px"><a class="btn btn-outline" href="../${esc(event.slug)}/" target="_blank">Ver convite ↗</a><button id="logout" class="btn btn-outline">Sair</button></div>
    </div></header>
    <div class="admin-shell">
      <div class="admin-tabs">${tabs}</div>
      <div class="admin-grid">
        ${adminEditorMarkup(event)}
        ${adminRsvpMarkup(event, rsvps)}
      </div>
    </div>
  </main>`;

  document.querySelectorAll('[data-tab]').forEach(btn => btn.addEventListener('click', () => paintAdmin(btn.dataset.tab)));
  document.getElementById('logout').addEventListener('click', async () => {
    await supabase.auth.signOut();
    renderLogin();
  });
  initAdminEditor(event);
  initAdminRsvps(event, rsvps);
}

function adminEditorMarkup(event) {
  return `<section class="admin-card">
    <h2>Informações do evento</h2>
    <div class="admin-card-sub">Edite o conteúdo exibido no convite público.</div>
    <form id="event-editor">
      <div class="admin-form-grid">
        ${adminField('nome','Nome do evento',event.nome)}
        ${adminField('dataHora','Data e hora',toLocalInput(event.dataHora),'datetime-local')}
        <div class="field full"><label>Tagline</label><input name="tagline" value="${esc(event.tagline)}" /></div>
        <div class="field full"><label>Descrição</label><textarea name="descricao">${esc(event.descricao)}</textarea></div>
        ${adminField('localNome','Nome do local',event.local.nome)}
        ${adminField('localEndereco','Endereço',event.local.endereco)}
        <div class="field full"><label>URL de incorporação do Maps</label><input name="mapsUrl" value="${esc(event.local.mapsUrl)}" /></div>
        <div class="field full"><label>URL “Como chegar”</label><input name="directionsUrl" value="${esc(event.local.directionsUrl || '')}" /></div>
        <div class="field full"><label>Dress code</label><textarea name="dressCode">${esc(event.dressCode)}</textarea></div>
        ${adminField('whatsappNumero','WhatsApp com DDI',event.whatsapp.numero)}
        <div class="field"><label>Máximo de acompanhantes</label><input type="number" name="maxAcompanhantes" min="0" max="20" value="${event.maxAcompanhantes}" /></div>
        <div class="field full"><label>Mensagem do WhatsApp</label><textarea name="whatsappTemplate">${esc(event.whatsapp.mensagemTemplate)}</textarea></div>
      </div>
      <div class="toggle-list">
        ${toggleMarkup('eventoPublicado','Evento publicado (visível ao público)',event.status === 'published')}
        ${toggleMarkup('sectionContador','Exibir contador regressivo',event.secoes.contador)}
        ${toggleMarkup('sectionDescricao','Exibir apresentação',event.secoes.descricao)}
        ${toggleMarkup('sectionDressCode','Exibir dress code',event.secoes.dressCode)}
        ${toggleMarkup('sectionMapa','Exibir localização e mapa',event.secoes.mapa)}
        ${toggleMarkup('coletaRestricao','Perguntar restrição alimentar no formulário',event.coletaRestricao)}
        ${toggleMarkup('whatsappHabilitado','Exibir confirmação pelo WhatsApp',event.whatsapp.habilitado)}
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-primary" type="submit">Salvar alterações</button><button class="btn btn-outline" type="button" id="change-password">Alterar senha</button></div>
    </form>
  </section>`;
}

function adminField(name, label, value, type = 'text') {
  return `<div class="field"><label>${label}</label><input type="${type}" name="${name}" value="${esc(value)}" /></div>`;
}

function toggleMarkup(name, label, checked) {
  return `<div class="toggle-row"><span>${label}</span><label class="switch"><input type="checkbox" name="${name}" ${checked ? 'checked' : ''}><span class="slider"></span></label></div>`;
}

function adminRsvpMarkup(event, rsvps) {
  const totalPeople = rsvps.reduce((sum, item) => sum + 1 + Number(item.acompanhantes || 0), 0);
  return `<section class="admin-card">
    <h2>Lista de confirmados</h2>
    <div class="admin-card-sub">Confirmações registradas para ${esc(event.nome)}.</div>
    <div class="stats"><div class="stat"><strong>${rsvps.length}</strong><span>Confirmações</span></div><div class="stat"><strong>${totalPeople}</strong><span>Total de pessoas</span></div></div>
    <div class="admin-tools"><input id="rsvp-search" placeholder="Buscar por nome ou telefone" /><button id="export-csv" class="btn btn-primary">Exportar CSV</button></div>
    <div class="rsvp-list" id="rsvp-list">${rsvpItemsMarkup(event, rsvps)}</div>
  </section>`;
}

function rsvpItemsMarkup(event, items) {
  if (!items.length) return '<div class="empty">Nenhuma presença confirmada até o momento.</div>';
  return items.map(item => `<article class="rsvp-item" data-rsvp-search="${esc(`${item.nome} ${item.telefone}`.toLowerCase())}">
    <div><strong>${esc(item.nome)}</strong><div class="rsvp-meta">${esc(item.telefone)} · ${Number(item.acompanhantes || 0)} acompanhante(s)<br>${new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(item.criadoEm))}${item.restricaoAlimentar ? `<br>Restrição: ${esc(item.restricaoAlimentar)}` : ''}${item.observacoes ? `<br>Obs.: ${esc(item.observacoes)}` : ''}</div></div>
    <button class="rsvp-delete" data-delete-rsvp="${esc(item.id)}" aria-label="Excluir confirmação">×</button>
  </article>`).join('');
}

function initAdminEditor(event) {
  const form = document.getElementById('event-editor');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(form);
    // Preserva chaves desconhecidas do content (meta, futuros campos de IA).
    const content = {
      ...event.content,
      tagline: fd.get('tagline'),
      descricao: fd.get('descricao'),
      dressCode: fd.get('dressCode'),
      local: { nome: fd.get('localNome'), endereco: fd.get('localEndereco'), mapsUrl: fd.get('mapsUrl'), directionsUrl: fd.get('directionsUrl') },
      whatsapp: { numero: fd.get('whatsappNumero'), habilitado: form.elements.whatsappHabilitado.checked, mensagemTemplate: fd.get('whatsappTemplate') },
      secoes: { contador: form.elements.sectionContador.checked, descricao: form.elements.sectionDescricao.checked, dressCode: form.elements.sectionDressCode.checked, mapa: form.elements.sectionMapa.checked }
    };
    try {
      await dataService.updateEvent(event.id, {
        name: fd.get('nome'),
        status: form.elements.eventoPublicado.checked ? 'published' : 'draft',
        starts_at: new Date(fd.get('dataHora')).toISOString(),
        max_companions: Math.max(0, Math.min(20, Number(fd.get('maxAcompanhantes') || 0))),
        collect_dietary: form.elements.coletaRestricao.checked,
        content
      });
      toast('Alterações salvas e refletidas no convite.');
      setTimeout(() => paintAdmin(event.slug), 500);
    } catch (err) {
      console.error(err);
      toast('Não foi possível salvar as alterações.', true);
    }
  });
  document.getElementById('change-password').addEventListener('click', async () => {
    const next = prompt('Digite a nova senha do painel (mínimo 6 caracteres):');
    if (!next) return;
    if (next.length < 6) return toast('A senha deve ter pelo menos 6 caracteres.', true);
    const { error } = await supabase.auth.updateUser({ password: next });
    if (error) return toast('Não foi possível alterar a senha.', true);
    toast('Senha alterada com sucesso.');
  });
}

function initAdminRsvps(event, rsvps) {
  const search = document.getElementById('rsvp-search');
  search.addEventListener('input', () => {
    const term = search.value.toLowerCase().trim();
    document.querySelectorAll('[data-rsvp-search]').forEach(item => item.classList.toggle('hidden', !item.dataset.rsvpSearch.includes(term)));
  });
  document.getElementById('export-csv').addEventListener('click', () => exportCsv(event, rsvps));
  document.querySelectorAll('[data-delete-rsvp]').forEach(btn => btn.addEventListener('click', async () => {
    if (!confirm('Excluir esta confirmação?')) return;
    try {
      await dataService.deleteRsvp(btn.dataset.deleteRsvp);
      toast('Confirmação excluída.');
      paintAdmin(event.slug);
    } catch (err) {
      console.error(err);
      toast('Não foi possível excluir a confirmação.', true);
    }
  }));
}

function exportCsv(event, rsvps) {
  const rows = [['Nome','Telefone','Acompanhantes','Restrição alimentar','Observações','Confirmado em']];
  rsvps.forEach(item => rows.push([item.nome,item.telefone,item.acompanhantes,item.restricaoAlimentar || '',item.observacoes || '',item.criadoEm]));
  const csv = '﻿' + rows.map(row => row.map(cell => `"${String(cell ?? '').replaceAll('"','""')}"`).join(';')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `confirmados-${event.slug}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function toast(message, error = false) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = `toast${error ? ' error' : ''}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

if (route === 'home') renderHome();
else if (route === 'admin') renderAdmin();
else renderEvent(route);
