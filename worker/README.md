# Servidor de Armi (opcional)

Sirve para que **todos** puedan usar el modo inteligente de Armi sin poner una clave. La clave de Gemini queda guardada en Cloudflare, no en la página.

1. Sacá una clave gratis en https://aistudio.google.com/apikey.
2. Creá una cuenta gratis en https://dash.cloudflare.com → **Workers & Pages → Create → Create Worker**. Ponele de nombre `armi`.
3. **Edit code**: borrá lo que hay, pegá el contenido de `armi-proxy.js` y tocá **Deploy**.
4. En el worker: **Settings → Variables and Secrets**:
   - `GEMINI_KEY` (tipo *Secret*): tu clave.
   - `ORIGEN`: `https://xxjoacoreberddxx.github.io`
   - `MODELO` (opcional): si no lo ponés, el servidor elige solo el modelo “flash” más nuevo.
5. Copiá la dirección del worker (algo como `https://armi.TU-USUARIO.workers.dev`) y pegala en `src/armalab.src.html`, en la línea `const ARMI_PROXY = '';`. Después `npm run build` y subí los cambios.

Plan gratis de Cloudflare: 100.000 pedidos por día. Plan gratis de Gemini: tiene un límite de pedidos por minuto y por día, y Google puede usar los pedidos para mejorar sus modelos.
