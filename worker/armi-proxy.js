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
    if (!r.ok) throw new Error((j.error && j.error.message) || 'no pude listar modelos');
    const ver = n => parseFloat((n.match(/gemini-(\d+(?:\.\d+)?)/) || [0, 0])[1]);
    const ms = (j.models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent') && /gemini-[\d.]+-flash/.test(m.name) && !/(image|tts|live|audio|thinking|exp|embed|preview)/.test(m.name));
    ms.sort((a, b) => ver(b.name) - ver(a.name) || (/lite/.test(a.name) - /lite/.test(b.name)));
    modeloCache = ms[0] ? ms[0].name.replace('models/', '') : 'gemini-2.5-flash';
  } catch (e) { return 'gemini-2.5-flash'; }
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
    if (req.method !== 'POST') {
      if (!env.GEMINI_KEY) return new Response('Servidor de Armi funcionando, pero FALTA la variable secreta GEMINI_KEY', { headers: cors });
      const modelo = env.MODELO || await elegirModelo(env.GEMINI_KEY);
      if (new URL(req.url).searchParams.has('probar')) {
        const res = await consultar(env, modelo, 'Respondé solo con JSON {"ok":true}', 'hola');
        return new Response(res.error ? `Prueba FALLÓ: ${res.error}` : `Prueba OK · modelo: ${modelo} · modo: ${res.modo} · tardó ${(res.ms / 1000).toFixed(1)} s`, { headers: cors });
      }
      return new Response(`Servidor de Armi (ArmaLab) funcionando · clave cargada · modelo: ${modelo} · para probar la IA agregá ?probar a la dirección`, { headers: cors });
    }
    let body; try { body = await req.json(); } catch { return json({ error: 'Pedido inválido' }, 400); }
    const { system, prompt } = body || {};
    if (typeof prompt !== 'string' || !prompt || prompt.length > 12000 || (system && system.length > 30000)) return json({ error: 'Pedido inválido' }, 400);
    const modelo = env.MODELO || await elegirModelo(env.GEMINI_KEY);
    const res = await consultar(env, modelo, String(system || ''), prompt);
    if (res.error) return json({ error: res.error }, res.status || 502);
    return json({ text: res.text, modelo, ms: res.ms, modo: res.modo });
  },
};

// Pide a Gemini una respuesta rápida. Los modelos nuevos “piensan” antes de contestar y eso puede tardar
// más de 30 s; probamos apagar o bajar ese razonamiento con los ajustes que acepte cada modelo.
async function consultar(env, modelo, system, prompt) {
  const t0 = Date.now();
  const variantes = [
    ['sin pensar', { thinkingBudget: 0 }],
    ['pensar mínimo', { thinkingLevel: 'minimal' }],
    ['pensar poco', { thinkingLevel: 'low' }],
    ['normal', null],
  ];
  let ultimo = 'sin detalle';
  for (const [modo, tc] of variantes) {
    const restante = 45000 - (Date.now() - t0);
    if (restante < 3000) break;
    let r, raw;
    try {
      r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_KEY },
        signal: AbortSignal.timeout(restante),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.35, maxOutputTokens: 4000, responseMimeType: 'application/json', ...(tc ? { thinkingConfig: tc } : {}) },
        }),
      });
      raw = await r.text();
    } catch (e) { return { error: `Gemini tardó más de ${Math.round((Date.now() - t0) / 1000)} s (${modelo}, ${modo})`, status: 504 }; }
    let j = {}; try { j = JSON.parse(raw); } catch {}
    if (r.ok) {
      const text = ((j.candidates || [])[0]?.content?.parts || []).filter(p => !p.thought).map(p => p.text || '').join('');
      return { text, ms: Date.now() - t0, modo };
    }
    ultimo = `Gemini ${r.status} (${modelo}): ${(j.error && j.error.message) || raw.slice(0, 200)}`;
    if (r.status === 404) modeloCache = null;
    if (r.status !== 400) break; // solo reintentamos si el modelo rechazó el ajuste de “pensar”
  }
  return { error: ultimo, status: 502 };
}
