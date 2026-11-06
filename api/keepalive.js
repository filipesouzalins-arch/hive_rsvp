// Mantém o banco Supabase acordado: o plano gratuito pausa o projeto após
// ~7 dias sem atividade. O cron do Vercel (vercel.json) chama esta função
// diariamente; a consulta mínima abaixo conta como atividade e evita a pausa.
const SUPABASE_URL = 'https://gklsynhauoffnncmhiwc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0W_0v0W_u9HPOxUQlLG1Xg_X-5KMXis';

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/events?select=id&limit=1`, {
      headers: { apikey: SUPABASE_KEY }
    });
    res.statusCode = r.ok ? 200 : 502;
    res.end(JSON.stringify({ ok: r.ok, supabaseStatus: r.status, at: new Date().toISOString() }));
  } catch (err) {
    res.statusCode = 502;
    res.end(JSON.stringify({ ok: false, error: String(err && err.message || err) }));
  }
};
