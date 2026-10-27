// Servidor de Armi para ArmaLab (Cloudflare Worker, plan gratis).
// Guarda la clave de Gemini en secreto y le responde a la página, así nadie más necesita clave.
// Variables a configurar en Cloudflare: GEMINI_KEY (secreto), ORIGEN (ej. https://xxjoacoreberddxx.github.io), MODELO (opcional).
// Si no configuraste MODELO, elige solo el modelo "flash" más nuevo disponible para tu clave.
let modeloCache = null;
async function elegirModelo(key) {
  if (modeloCache) return modeloCache;
  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': key } });
    const j = await r.json();
    const ver = n => parseFloat((n.match(/gemini-(\d+(?:\.\d+)?)/) || [0, 0])[1]);
    const ms = (j.models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent') && /gemini-[\d.]+-flash/.test(m.name) && !/(image|tts|live|audio|thinking|exp|embed|preview)/.test(m.name));
    ms.sort((a, b) => ver(b.name) - ver(a.name) || (/lite/.test(a.name) - /lite/.test(b.name)));
    modeloCache = ms[0] ? ms[0].name.replace('models/', '') : 'gemini-2.5-flash';
  } catch { modeloCache = 'gemini-2.5-flash'; }
  return modeloCache;
}

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
    const modelo = env.MODELO || await elegirModelo(env.GEMINI_KEY);
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
