// Serve as rotas de convite injetando as meta tags do evento (título/descrição
// de compartilhamento editáveis no admin). Robôs de preview (WhatsApp etc.) não
// executam JS — por isso a troca precisa acontecer no servidor.
const SUPABASE_URL = 'https://gklsynhauoffnncmhiwc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0W_0v0W_u9HPOxUQlLG1Xg_X-5KMXis';

const escapeHtml = value => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

module.exports = async (req, res) => {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const base = `${proto}://${host}`;

  let html = '';
  try {
    html = await (await fetch(`${base}/index.html`)).text();
  } catch {
    res.statusCode = 500;
    return res.end('');
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60');

  try {
    const path = String(req.query.path || '').replace(/\/+$/, '');
    const slug = path.split('/').pop();
    if (slug && /^[a-z0-9][a-z0-9-]{1,58}$/.test(slug)) {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/events?slug=eq.${slug}&status=eq.published&select=name,content`,
        { headers: { apikey: SUPABASE_KEY } }
      );
      const [event] = await r.json();
      if (event) {
        const meta = (event.content && event.content.meta) || {};
        const title = escapeHtml(meta.title || `${event.name} — Convite`);
        const description = escapeHtml(meta.description || (event.content && event.content.tagline) || 'Confirme sua presença.');
        const themeColor = escapeHtml(meta.themeColor || '#0a0a0a');
        html = html
          .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
          .replace(/(<meta name="description" content=")[^"]*(")/, `$1${description}$2`)
          .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${title}$2`)
          .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${description}$2`)
          .replace(/(<meta name="theme-color" content=")[^"]*(")/, `$1${themeColor}$2`);
        if (meta.shareImage) {
          const image = meta.shareImage.startsWith('http') ? meta.shareImage : `${base}${meta.shareImage}`;
          html = html.replace('</head>', `  <meta property="og:image" content="${escapeHtml(image)}" />\n</head>`);
        }
      }
    }
  } catch {
    // Em qualquer falha, entrega o HTML padrão — o app resolve no cliente.
  }
  res.end(html);
};
