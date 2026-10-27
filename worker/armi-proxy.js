// Servidor de Armi para ArmaLab (Cloudflare Worker, plan gratis).
// Guarda la clave de Gemini en secreto y le responde a la página, así nadie más necesita clave.
// Variables a configurar en Cloudflare: GEMINI_KEY (secreto), ORIGEN (ej. https://xxjoacoreberddxx.github.io), MODELO (opcional).
export default {
  async fetch(req, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ORIGEN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST') return new Response('Servidor de Armi (ArmaLab) funcionando', { headers: cors });
    let body; try { body = await req.json(); } catch { return json({ error: 'Pedido inválido' }, 400); }
    const { system, prompt } = body || {};
    if (typeof prompt !== 'string' || !prompt || prompt.length > 12000 || (system && system.length > 30000)) return json({ error: 'Pedido inválido' }, 400);
    const modelo = env.MODELO || 'gemini-2.5-flash';
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: String(system || '') }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.35, responseMimeType: 'application/json' },
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return json({ error: (j.error && j.error.message) || 'Gemini no respondió' }, 502);
    const text = ((j.candidates || [])[0]?.content?.parts || []).map(p => p.text || '').join('');
    return json({ text });
  },
};
