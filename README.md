# ArmaLab

**Modelá, cortá, armá.** ArmaLab es un modelador 3D de manualidades que trabaja con materiales reales de librería: cartón gris, foamboard, corrugado, papel crepé, seda, kraft, goma eva, alambre y más. Elegís qué querés hacer y de qué tamaño, y te devuelve:

- las **piezas a cortar** con medidas en cm,
- las **plantillas en tamaño real** para imprimir en A4 (con mosaico para piezas grandes),
- la **lista de compras** con precios relevados en Argentina (minorista vs. mayorista) y el costo por unidad,
- el **paso a paso** con tus medidas,
- avisos de **física**: si el cartón aguanta, cuánto pesa y si se puede caer,
- y **Armi**, un asistente al que le pedís “árbol sakura de 3 metros” y te arma todo solo.

👉 **Probalo online:** https://xxjoacoreberddxx.github.io/Armalab/

Versión actual: **0.4.7** (beta). Ver [CHANGELOG.md](CHANGELOG.md).

## Qué podés hacer

| Para la mesa | Gran escala |
|---|---|
| Sakura de alambre y crepé (10–30 cm) | Flor gigante de papel (30 cm – 1,5 m) |
| Árbol de encastre de cartón (10–40 cm) | Standee de tamaño real con tu imagen (1–2,2 m) |
| Casita de cartón (corrige medidas por espesor) | Árbol grande con estructura (0,8–3,5 m) |
| Caja con tapa (troquel con pliegues) | Papel maché / piñata (15 cm – 1,5 m) |
| | Cartel de mano con palo (20 cm – 1,2 m) |
| Modelador libre: placas, discos, tubos, conos, cajas, cilindros, pirámides, prismas, varillas, bolitas, papel maché | Letras 3D para cartelería (5 cm – 1 m) |

Cada material tiene **ficha con imagen** (cómo es, cómo se corta y se pega, dónde comprarlo con link). La pestaña **Comunidad** guarda fotos y videos de lo que armaste para compartirlos.

La pestaña **Técnicas** explica cómo se comporta cada papel (arrugar, estirar el crepé, fibra, rigidez, curvado, alabeo, papel maché) y trae calculadoras.

## Cómo usarlo

- **Online:** https://xxjoacoreberddxx.github.io/Armalab/
- **Sin internet (Windows):** descargá `ArmaLab-offline.html` y abrilo con doble clic en Chrome o Edge. Desde ahí se pueden imprimir las plantillas.
- Al imprimir: **Escala 100 %** y **Márgenes: ninguno**. Medí la barra de control de cada hoja: tiene que dar 5 cm.

Los proyectos se guardan solos en el navegador. Para pasarlos a otra compu: *Proyecto → Guardar / abrir → Copiar código*.

## Publicar en GitHub Pages

1. Subí el contenido de esta carpeta a un repositorio (por ejemplo `armalab`).
2. En el repo: **Settings → Pages → Source: Deploy from a branch → Branch: `main` / `(root)`**.
3. En un par de minutos queda en `https://TU-USUARIO.github.io/armalab/`.

## Desarrollo

```
src/armalab.src.html   código fuente (único archivo: HTML + CSS + JS)
build.py               genera index.html, ArmaLab-offline.html y dist/artifact.html
tests/tests.js         109 pruebas automáticas (Playwright)
worker/armi-proxy.js   servidor opcional de Armi (Cloudflare Worker)
tests/capturas.js      capturas de las pantallas principales
tests/smoke.js         recorre todas las plantillas y saca capturas
```

```bash
npm install            # instala Playwright y Three.js 0.147 para el build
npm run build          # python3 build.py node_modules/three
npm test               # corre las 109 pruebas
```

## Datos y límites

- **Precios:** relevados en Mercado Libre, librerías y mayoristas argentinos a fines de octubre de 2026 (El Poli, Librería Mayorista Leo, Multienvases, Hijos de Garber, entre otros). Cambian seguido: se editan en la pestaña *Precios*.
- **Reglas de cantidades** (largo de alambre, flores por copa, pasta de papel maché, factor de arrugado, tiempos): son estimaciones a calibrar con prototipos reales.
- **Física:** rigidez ∝ espesor^2,6 (Iggesund Reference Manual); caballete de standee = 75 % de la altura (práctica de fabricantes); ángulo de vuelco θ = atan((base/2)/altura del centro de masa), con umbrales de diseño 12° y 20°.
- **Armi** tiene dos modos: *sin internet* (reglas propias de ArmaLab) e *inteligente* (un modelo de lenguaje interpreta el pedido y arma plantillas u objetos nuevos con piezas). El inteligente usa tu clave gratis de Gemini o un servidor propio: ver [worker/README.md](worker/README.md).
- **Imágenes de personas o personajes:** para venderlas puede hacer falta permiso de quien tiene los derechos.

## Créditos y licencia

Hecho en Buenos Aires, Argentina, por **Joaco**, con Claude.

Código: MIT © 2026 Joaco. Usa [Three.js](https://threejs.org) r147 (MIT) y la tipografía *Helvetiker* incluida en los ejemplos de Three.js.
