# Cambios

## 0.4.7 — 2026-10-27

- Armi apila bien: cada pieza puede decir sobre cuál va ("sobre") y la app calcula la altura sola. Así las jirafas tienen patas → cuerpo → cuello → cabeza en orden.
- Recetas nuevas de animales de 4 patas y personas, con un ejemplo completo de jirafa; el muñeco de nieve se arma con esferas (no con nubes de bolitas).
- La gravedad ya no tira al piso las piezas pegadas de costado (narices, brazos, puertas).
- Papel maché con color: se pinta del color pedido. Pintura y harina se comparten entre piezas (antes compraba una lata de látex por cada bola).

## 0.4.6 — 2026-10-26

- Armi sabe mucho más: fichas de todos los materiales, técnicas, geometría exacta de cada pieza y recetas de más de 20 objetos comunes (maceta, florero, portalápices, auto, robot, castillo, muñeco de nieve…).
- Las piezas que la IA deja flotando se bajan solas hasta apoyar.
- Servidor: usa primero el modelo “flash” completo (más inteligente) y el “lite” solo de respaldo.

## 0.4.5 — 2026-10-26

- Armi inteligente arma objetos más lindos: primero piensa las partes (estructura, forrado, detalles), sigue ejemplos y solo menciona lo que realmente puso.
- Piezas con **forrado** de papel de color (crepé, seda, afiche, cartulina, glasé, aluminio, goma eva): cambia el color en el 3D y suma el papel a la compra.

## 0.4.4 — 2026-10-26

- Servidor de Armi: usa primero los modelos “flash-lite” (los más rápidos) y si uno tarda más de 15 s pasa al siguiente.

## 0.4.3 — 2026-10-26

- Servidor de Armi: prueba varios ajustes para que Gemini conteste sin razonar de más, informa qué modelo y modo usó, y tiene una prueba rápida en `?probar`.

## 0.4.2 — 2026-10-26

- Armi más rápido: el servidor le pide a Gemini que responda sin “pensar” de más y corta a los 25 segundos; la página espera como máximo 35 segundos y si no, responde sin internet.

## 0.4.1 — 2026-10-26

- Armi usa el modo inteligente para todos a través del servidor de ArmaLab (sin poner ninguna clave). Aviso de privacidad en el chat.

## 0.4.0 — 2026-10-26

- **Armi inteligente** (opcional): con una clave gratis de Gemini o un servidor propio, entiende cualquier pedido y arma objetos nuevos combinando piezas (por ejemplo una mesita). Las respuestas de la IA se validan: piezas inventadas se descartan y las medidas imposibles se corrigen. Si no hay conexión, responde con las reglas.
- Armi sin internet entiende carteles, “hacelo más grande / más chico” y cambios de color.
- Plantilla nueva: **cartel de mano** con palo y tira de refuerzo, con el texto dibujado en el 3D.
- Árboles más lindos: ramas continuas que se afinan, copa esponjosa con flores de dos tonos y pétalos caídos.
- Rendimiento: dibuja solo cuando algo cambia, ramas fusionadas en una sola pieza, modo liviano en celulares (menos flores, sin sombras).
- Servidor opcional de Armi para Cloudflare Workers (`worker/`).
- 105 pruebas automáticas.

## 0.3.0 — 2026-10-26

- **Armi**, asistente integrado: entiende pedidos como “árbol sakura de 3 metros”, “20 cajitas de 8 cm” o “letras KIZUNA de 40 cm”, arma el modelo solo, recomienda materiales con el porqué, y responde sobre materiales, técnicas y costos.
- Nuevo logo y encabezado centrado; créditos: hecho en Buenos Aires por Joaco, con Claude.
- Materiales con imagen y ficha (cómo es, gramaje, peso, rigidez, corte, pegamento, dónde comprar con links a Mercado Libre y tiendas).
- Formas nuevas en el modelador: caja/cubo, cilindro, pirámide y prisma triangular, con troqueles y líneas de pliegue.
- “Qué cortar” en tarjetas por material, con menos texto y etiquetas de color.
- Totales (alto, peso, costo, tiempo, estabilidad) abajo en la vista 3D.
- Compras: tienda elegible por producto, modos “lo más barato / todo suelto / mayorista” y links.
- Más técnicas: pompones, pétalos con copa, cortes con cutter, pasar moldes, encastres, endurecer papel, pintar cartón, quilling.
- Comunidad: galería de fotos y videos con el proyecto adjunto, y compartir.
- 96 pruebas automáticas.

## 0.2.0 — 2026-10-26

- Nuevo diseño e identidad (logo, nombre, novedades por versión).
- Plantillas de gran escala: árbol de 0,8–3,5 m con alma, ramas de alambre galvanizado, tronco de kraft y base con lastre; standee de tamaño real con imagen propia y caballete al 75 %; flor gigante de papel; papel maché / piñata; letras 3D.
- Caja con tapa: troquel con pestañas y líneas de pliegue.
- Pestaña **Técnicas**: arrugado por tipo de papel, estiramiento del crepé, fibra, rigidez, curvado con ranuras, alabeo por cola, papel maché, uniones; con calculadoras.
- Física: peso estimado, centro de masa y semáforo de vuelco; avisos de espesor según la altura (hasta 3 m).
- Precios relevados en octubre 2026 con varias ofertas por material (suelto, pack, mayorista), descuento por transferencia, “¿cuántas unidades?” y costo por unidad.
- Plantillas: moldes grandes en mosaico A4 con códigos A1, A2…, franja de encimado, puntos clave para trazar sin imprimir, flechas de veta y líneas de pliegue.
- Tiras y placas más largas que la hoja se calculan en tramos con solape.
- Modelador: conos, papel maché, texturas arrugadas (con consumo extra de papel), regla en metros y persona de 1,70 m de referencia.
- 77 pruebas automáticas.

## 0.1.0 — 2026-10-26

- Primera beta: sakura de alambre, árbol de encastre, casita de cartón, modelador libre, lista de compras, paso a paso y plantillas 1:1.
