// Servidor de Armi para ArmaLab (Cloudflare Worker, plan gratis).
// Guarda la clave de Gemini en secreto y le responde a la página, así nadie más necesita clave.
// Variables a configurar en Cloudflare: GEMINI_KEY (secreto), ORIGEN (ej. https://xxjoacoreberddxx.github.io), MODELO (opcional).
// Si no configuraste MODELO, arma una lista de modelos rápidos: primero los “flash-lite” (los más veloces),
// después los “flash”, del más nuevo al más viejo. Si uno tarda, se pasa al siguiente.
let modelosCache = null;
async function elegirModelos(key) {
  if (modelosCache) return modelosCache;
  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': key } });
    const j = await r.json();
    if (!r.ok) throw new Error((j.error && j.error.message) || 'no pude listar modelos');
    const ver = n => parseFloat((n.match(/gemini-(\d+(?:\.\d+)?)/) || [0, 0])[1]);
    const ms = (j.models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent') && /gemini-[\d.]+-flash/.test(m.name) && !/(image|tts|live|audio|thinking|exp|embed|preview)/.test(m.name));
    ms.sort((a, b) => (/lite/.test(b.name) - /lite/.test(a.name)) || ver(b.name) - ver(a.name));
    modelosCache = ms.slice(0, 4).map(m => m.name.replace('models/', ''));
    if (!modelosCache.length) modelosCache = ['gemini-2.5-flash-lite', 'gemini-2.5-flash'];
  } catch (e) { return ['gemini-2.5-flash-lite', 'gemini-2.5-flash']; }
  return modelosCache;
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
      const modelos = env.MODELO ? [env.MODELO] : await elegirModelos(env.GEMINI_KEY);
      if (new URL(req.url).searchParams.has('probar')) {
        const res = await consultar(env, modelos, 'Respondé solo con JSON {"ok":true}', 'hola');
        return new Response(res.error ? `Prueba FALLÓ: ${res.error}` : `Prueba OK · modelo: ${res.modelo} · modo: ${res.modo} · tardó ${(res.ms / 1000).toFixed(1)} s`, { headers: cors });
      }
      return new Response(`Servidor de Armi (ArmaLab) funcionando · clave cargada · modelos: ${modelos.join(', ')} · para probar la IA agregá ?probar a la dirección`, { headers: cors });
    }
    let body; try { body = await req.json(); } catch { return json({ error: 'Pedido inválido' }, 400); }
    const { system, prompt } = body || {};
    if (typeof prompt !== 'string' || !prompt || prompt.length > 12000 || (system && system.length > 30000)) return json({ error: 'Pedido inválido' }, 400);
    const modelos = env.MODELO ? [env.MODELO] : await elegirModelos(env.GEMINI_KEY);
    const res = await consultar(env, modelos, String(system || ''), prompt);
    if (res.error) return json({ error: res.error }, res.status || 502);
    return json({ text: res.text, modelo: res.modelo, ms: res.ms, modo: res.modo });
  },
};

// Pide a Gemini una respuesta rápida. Prueba los modelos de la lista en orden: a cada uno le da hasta 15 s.
// Los modelos nuevos “piensan” antes de contestar; probamos apagar o bajar ese razonamiento con el ajuste que acepten.
async function consultar(env, modelos, system, prompt) {
  const t0 = Date.now();
  const variantes = [['sin pensar', { thinkingBudget: 0 }], ['pensar mínimo', { thinkingLevel: 'minimal' }], ['pensar poco', { thinkingLevel: 'low' }], ['normal', null]];
  const fallas = [];
  for (const modelo of modelos) {
    for (const [modo, tc] of variantes) {
      const restante = 44000 - (Date.now() - t0);
      if (restante < 3000) return { error: `se terminó el tiempo · ${fallas.join(' | ')}`, status: 504 };
      let r, raw;
      try {
        r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_KEY },
          signal: AbortSignal.timeout(Math.min(15000, restante)),
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.35, maxOutputTokens: 4000, responseMimeType: 'application/json', ...(tc ? { thinkingConfig: tc } : {}) },
          }),
        });
        raw = await r.text();
      } catch (e) { fallas.push(`${modelo}: tardó más de 15 s`); break; } // este modelo está lento: probamos el siguiente
      let j = {}; try { j = JSON.parse(raw); } catch {}
      if (r.ok) {
        const text = ((j.candidates || [])[0]?.content?.parts || []).filter(p => !p.thought).map(p => p.text || '').join('');
        return { text, ms: Date.now() - t0, modo, modelo };
      }
      fallas.push(`${modelo} ${r.status}: ${((j.error && j.error.message) || raw).slice(0, 120)}`);
      if (r.status === 404) modelosCache = null;
      if (r.status !== 400) break; // si no es por el ajuste de “pensar”, pasamos al siguiente modelo
    }
  }
  return { error: fallas.join(' | ') || 'sin detalle', status: 502 };
}
